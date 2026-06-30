import React, { useState, useEffect, useRef } from 'react';
import { Mic, Plus, Search, Trash2, Edit2, X, Calendar } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL;

// Task status and priority options
const STATUSES = ['To Do', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

function App() {
  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState('kanban');
  const [isRecording, setIsRecording] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [parsedTask, setParsedTask] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    dueDate: ''
  });
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`);
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const createTask = async (taskData) => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      const newTask = await response.json();
      setTasks([...tasks, newTask]);
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const updateTask = async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedTask = await response.json();
      setTasks(tasks.map(t => t._id === id ? updatedTask : t));
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t._id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      alert('Microphone access denied. Please allow microphone access and try again.');
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob) => {
    setIsProcessing(true);
    setShowVoiceModal(true);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch(`${API_URL}/voice/parse`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process voice input');
      }

      const data = await response.json();
      setVoiceTranscript(data.transcript);
      setParsedTask(data.parsed);
    } catch (error) {
      console.error('Error processing voice:', error);
      alert('Error processing voice input. Please check your backend server and try again.');
      setShowVoiceModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVoiceTaskCreate = async () => {
    if (parsedTask) {
      await createTask(parsedTask);
      setShowVoiceModal(false);
      setVoiceTranscript('');
      setParsedTask(null);
    }
  };

  const handleManualTaskSubmit = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    const taskData = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate || null
    };

    if (currentTask) {
      await updateTask(currentTask._id, taskData);
    } else {
      await createTask(taskData);
    }
    setShowTaskModal(false);
    setCurrentTask(null);
    setFormData({
      title: '',
      description: '',
      status: 'To Do',
      priority: 'Medium',
      dueDate: ''
    });
  };

  const openTaskModal = (task = null) => {
    if (task) {
      setCurrentTask(task);
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
      });
    } else {
      setCurrentTask(null);
      setFormData({
        title: '',
        description: '',
        status: 'To Do',
        priority: 'Medium',
        dueDate: ''
      });
    }
    setShowTaskModal(true);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'bg-green-100 text-green-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-orange-100 text-orange-800',
      Urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">🎯 Task Tracker</h1>
            <div className="flex gap-2">
              <button
                onClick={() => openTaskModal()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} /> Add Task
              </button>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white`}
              >
                <Mic size={20} />
                {isRecording ? 'Stop Recording' : 'Voice Input'}
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex gap-4 mt-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priority</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="flex gap-2 border rounded-lg p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUSES.map(status => (
              <div key={status} className="bg-white rounded-lg p-4 shadow-sm">
                <h2 className="font-semibold text-lg mb-4 text-gray-700 flex items-center justify-between">
                  {status}
                  <span className="text-sm font-normal text-gray-500">
                    {filteredTasks.filter(t => t.status === status).length}
                  </span>
                </h2>
                <div className="space-y-3">
                  {filteredTasks.filter(t => t.status === status).length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-8">No tasks</p>
                  ) : (
                    filteredTasks.filter(t => t.status === status).map(task => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onEdit={() => openTaskModal(task)}
                        onDelete={() => deleteTask(task._id)}
                        onStatusChange={(newStatus) => updateTask(task._id, { status: newStatus })}
                        getPriorityColor={getPriorityColor}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr className="text-left">
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Priority</th>
                  <th className="p-4 font-semibold">Due Date</th>
                  <th className="p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-400">
                      No tasks found. Create one to get started!
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => (
                    <tr key={task._id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{task.title}</div>
                        {task.description && <div className="text-sm text-gray-500 mt-1">{task.description}</div>}
                      </td>
                      <td className="p-4">
                        <select
                          value={task.status}
                          onChange={(e) => updateTask(task._id, { status: e.target.value })}
                          className="px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        {task.dueDate ? new Date(task.dueDate).toLocaleString() : '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => openTaskModal(task)} 
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => deleteTask(task._id)} 
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Task Modal */}
      {showTaskModal && (
        <Modal onClose={() => { setShowTaskModal(false); setCurrentTask(null); }}>
          <h2 className="text-xl font-bold mb-4">{currentTask ? 'Edit Task' : 'Create New Task'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter task title..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Add more details..."
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select 
                  value={formData.status} 
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select 
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <button 
                onClick={() => { setShowTaskModal(false); setCurrentTask(null); }} 
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleManualTaskSubmit} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {currentTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Voice Modal */}
      {showVoiceModal && (
        <Modal onClose={() => { setShowVoiceModal(false); setVoiceTranscript(''); setParsedTask(null); }}>
          <h2 className="text-xl font-bold mb-4">🎤 Voice Input Result</h2>
          {isProcessing ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Processing your voice input...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">📝 Transcript</label>
                <div className="p-3 bg-gray-50 rounded-lg text-sm border">{voiceTranscript}</div>
              </div>
              {parsedTask && (
                <>
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-3">Review and edit the extracted information:</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      value={parsedTask.title}
                      onChange={(e) => setParsedTask({...parsedTask, title: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={parsedTask.description || ''}
                      onChange={(e) => setParsedTask({...parsedTask, description: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Priority</label>
                      <select
                        value={parsedTask.priority}
                        onChange={(e) => setParsedTask({...parsedTask, priority: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        value={parsedTask.status}
                        onChange={(e) => setParsedTask({...parsedTask, status: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Due Date</label>
                    <input
                      type="datetime-local"
                      value={parsedTask.dueDate ? new Date(parsedTask.dueDate).toISOString().slice(0, 16) : ''}
                      onChange={(e) => setParsedTask({...parsedTask, dueDate: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <button 
                      onClick={() => { setShowVoiceModal(false); setVoiceTranscript(''); setParsedTask(null); }} 
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleVoiceTaskCreate} 
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Create Task
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onStatusChange, getPriorityColor }) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg border hover:shadow-md transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-sm flex-1 pr-2">{task.title}</h3>
        <div className="flex gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }} 
            className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="text-red-600 hover:text-red-800 p-1 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {task.description && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>}
      <div className="flex items-center justify-between mb-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar size={12} />
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
      <select
        value={task.status}
        onChange={(e) => { e.stopPropagation(); onStatusChange(e.target.value); }}
        className="w-full mt-2 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={(e) => e.stopPropagation()}
      >
        {['To Do', 'In Progress', 'Done'].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <button 
            onClick={onClose} 
            className="float-right text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}

export default App;