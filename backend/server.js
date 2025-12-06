const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const Groq = require('groq-sdk');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/task-tracker')
.then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// Task Schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['To Do', 'In Progress', 'Done'], default: 'To Do' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  dueDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// Groq Client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Helper function to parse relative dates
function parseRelativeDate(dateStr) {
  const now = new Date();
  const lowerStr = dateStr.toLowerCase();
  
  // Tomorrow
  if (lowerStr.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (lowerStr.includes('evening')) {
      tomorrow.setHours(18, 0, 0, 0);
    } else if (lowerStr.includes('morning')) {
      tomorrow.setHours(9, 0, 0, 0);
    } else if (lowerStr.includes('afternoon')) {
      tomorrow.setHours(14, 0, 0, 0);
    } else {
      tomorrow.setHours(17, 0, 0, 0);
    }
    return tomorrow;
  }
  
  // Today
  if (lowerStr.includes('today')) {
    const today = new Date(now);
    if (lowerStr.includes('evening')) {
      today.setHours(18, 0, 0, 0);
    } else if (lowerStr.includes('morning')) {
      today.setHours(9, 0, 0, 0);
    } else if (lowerStr.includes('afternoon')) {
      today.setHours(14, 0, 0, 0);
    } else {
      today.setHours(17, 0, 0, 0);
    }
    return today;
  }
  
  // Next week
  if (lowerStr.includes('next week')) {
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(17, 0, 0, 0);
    return nextWeek;
  }
  
  // Days of week
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (lowerStr.includes(days[i])) {
      const targetDay = i;
      const currentDay = now.getDay();
      let daysToAdd = targetDay - currentDay;
      
      if (lowerStr.includes('next')) {
        daysToAdd += 7;
      } else if (daysToAdd <= 0) {
        daysToAdd += 7;
      }
      
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysToAdd);
      targetDate.setHours(17, 0, 0, 0);
      return targetDate;
    }
  }
  
  // In X days
  const daysMatch = dateStr.match(/in (\d+) days?/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);
    futureDate.setHours(17, 0, 0, 0);
    return futureDate;
  }
  
  return null;
}

// Routes

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const task = new Task({
      title: title.trim(),
      description: description || '',
      status: status || 'To Do',
      priority: priority || 'Medium',
      dueDate: dueDate || null
    });
    
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        status,
        priority,
        dueDate,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Voice input parsing
app.post('/api/voice/parse', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('📝 Processing voice input...');
    console.log('File size:', req.file.size, 'bytes');
    console.log('File type:', req.file.mimetype);

    // Step 1: Transcribe audio using Groq Whisper
    // Convert buffer to a format Groq SDK expects
    const tmpFilePath = path.join(__dirname, 'temp_audio.webm');
    
    // Write buffer to temporary file
    fs.writeFileSync(tmpFilePath, req.file.buffer);

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(tmpFilePath),
      model: 'whisper-large-v3-turbo',
      response_format: 'json'
    });

    // Delete temporary file
    fs.unlinkSync(tmpFilePath);

    const transcript = transcription.text;
    console.log('✅ Transcription:', transcript);

    // Step 2: Parse the transcript using Groq LLM
    const parsePrompt = `You are a task parser. Extract task information from the following text and respond ONLY with valid JSON (no markdown, no explanation).

Text: "${transcript}"

Extract these fields:
- title: The main task description (string, required)
- description: Additional details (string, optional, can be empty)
- priority: One of: Low, Medium, High, Urgent (default: Medium)
- status: One of: To Do, In Progress, Done (default: To Do)
- dueDate: ISO date string or null (parse relative dates like "tomorrow", "next Monday", "in 3 days")

Current date/time: ${new Date().toISOString()}

Rules:
- Keep title concise and action-oriented
- Extract priority from words like "urgent", "high priority", "critical", "important"
- Parse dates carefully - "tomorrow evening" should be tomorrow at 6 PM
- If no priority mentioned, use "Medium"
- Status should default to "To Do" unless explicitly mentioned

Response format (JSON only):
{
  "title": "extracted title",
  "description": "extracted description or empty string",
  "priority": "extracted priority",
  "status": "To Do",
  "dueDate": "ISO date string or null"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that extracts structured task information. Always respond with valid JSON only, no markdown formatting.'
        },
        {
          role: 'user',
          content: parsePrompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 500
    });

    let parsedData;
    try {
      const responseText = completion.choices[0].message.content.trim();
      console.log('🤖 LLM Response:', responseText);
      
      // Remove markdown code blocks if present
      const jsonText = responseText.replace(/```json\n?|\n?```/g, '');
      parsedData = JSON.parse(jsonText);
      
      console.log('✅ Parsed data:', parsedData);
    } catch (parseError) {
      console.error('❌ Error parsing LLM response:', parseError);
      // Fallback parsing
      parsedData = {
        title: transcript,
        description: '',
        priority: 'Medium',
        status: 'To Do',
        dueDate: null
      };
    }

    // Additional date parsing if needed
    if (parsedData.dueDate && typeof parsedData.dueDate === 'string') {
      const parsedDate = parseRelativeDate(parsedData.dueDate);
      if (parsedDate) {
        parsedData.dueDate = parsedDate.toISOString();
      }
    }

    res.json({
      transcript: transcript,
      parsed: parsedData
    });

  } catch (error) {
    console.error('❌ Voice parsing error:', error);
    res.status(500).json({ error: 'Failed to process voice input: ' + error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});