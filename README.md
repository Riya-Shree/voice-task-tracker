# Voice-Enabled Task Tracker

A full-stack task management application with intelligent voice input powered by Groq AI. Users can create tasks by speaking naturally, and the system intelligently extracts task details like title, priority, due date, and status.

## ✨ Features

- **Voice Input**: Create tasks by speaking naturally
- **Intelligent Parsing**: AI-powered extraction of task details from voice input
- **Task Management**: Full CRUD operations for tasks
- **Multiple Views**: Kanban board and list view
- **Filtering & Search**: Filter by status, priority, and search by title/description
- **Responsive Design**: Works seamlessly on desktop devices

## 🛠️ Tech Stack

### Frontend

- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Fetch API

### Backend

- **Framework**: Node.js with Express
- **Database**: MongoDB
- **AI Services**: Groq (Whisper for transcription, Llama for parsing)
- **File Upload**: Multer

### Key Libraries

- **mongoose**: MongoDB ODM
- **groq-sdk**: Groq AI SDK
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management

## 📋 Prerequisites

Before running this project, make sure you have:

1. **Node.js** (v16 or higher)

   ```bash
   node --version
   ```

2. **MongoDB** installed and running

   - Install MongoDB Compass: https://www.mongodb.com/products/compass
   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

3. **Groq API Key**
   - Sign up at https://console.groq.com
   - Create a new API key (it's free!)

## 📁 Project Structure

```
voice-task-tracker/
├── backend/
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables
│   └── .env.example           # Example environment file
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── index.js          # React entry point
│   │   └── index.css         # Tailwind CSS
│   ├── public/
│   ├── package.json          # Frontend dependencies
│   └── tailwind.config.js    # Tailwind configuration
└── README.md
```

## 🎯 How to Use

### Manual Task Creation

1. Click the "Add Task" button
2. Fill in the task details (title, description, status, priority, due date)
3. Click "Create" to save the task

### Voice Task Creation

1. Click the microphone icon
2. Speak your task naturally, for example:
   - "Create a high priority task to review the pull request for the authentication module by tomorrow evening"
   - "Remind me to send the project proposal to the client by next Wednesday, it's urgent"
   - "Add a task to update the documentation by Friday"
3. Click "Stop Recording" (or it stops automatically after silence)
4. Review the extracted fields
5. Edit if needed and click "Create Task"

### Task Management

- **View Toggle**: Switch between Kanban and List views
- **Search**: Type in the search bar to filter tasks by title or description
- **Filters**: Use status and priority dropdowns to filter tasks
- **Edit**: Click the edit icon on any task
- **Delete**: Click the trash icon (with confirmation)
- **Status Update**: Drag tasks between columns (Kanban) or use dropdown (List)

## 💡 Key Design Decisions

### Voice Processing Pipeline

1. **Audio Capture**: Browser MediaRecorder API captures audio in WebM format
2. **Transcription**: Groq Whisper (whisper-large-v3-turbo) converts speech to text
3. **Parsing**: Groq Llama (llama-3.3-70b-versatile) extracts structured data from transcript
4. **Date Parsing**: Custom function handles relative dates (tomorrow, next Monday, etc.)
5. **User Review**: Extracted fields shown for review before saving

### Database Schema

- Mongoose ODM for MongoDB
- Fields: title, description, status, priority, dueDate, createdAt, updatedAt
- Validation using enums for status and priority
- Automatic timestamp management

### Frontend Architecture

- React functional components with hooks
- State management using useState
- No Redux (not required for single-user app)
- Modular components (TaskCard, Modal)

## ⚠️ Known Limitations

1. **Voice Input Quality**: Accuracy depends on microphone quality and background noise
2. **Date Parsing**: May not handle all date formats (e.g., "December 15th")
3. **Single User**: No authentication or multi-user support
4. **Browser Compatibility**: Voice input requires modern browsers with MediaRecorder API
5. **Audio Format**: Backend expects WebM audio (browser default)

## 🔮 Future Enhancements

1. **User Authentication**: Multi-user support with JWT
2. **Real-time Updates**: WebSocket for live collaboration
3. **Drag & Drop**: Native drag-and-drop in Kanban view
4. **Mobile App**: React Native version
5. **Task Categories**: Organize tasks by projects/categories
6. **Recurring Tasks**: Support for repeating tasks
7. **Notifications**: Reminders for due dates
8. **Export**: Export tasks to CSV/JSON
9. **Dark Mode**: Theme toggle
10. **Voice Commands**: "Delete task", "Mark as complete" voice actions

## 👤 Author

Riya Shree

## 🙏 Acknowledgments

- Groq for amazing AI APIs
- MongoDB for database
- React and Tailwind CSS communities
