# Voice-Enabled Task Tracker

A full-stack task management application with intelligent voice input powered by Groq AI. Users can create tasks by speaking naturally, and the system intelligently extracts task details like title, priority, due date, and status.

## 🎥 Demo Video

[Upload your demo video to Loom or Google Drive]

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

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd voice-task-tracker
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your credentials
# MONGODB_URI=mongodb://localhost:27017/task-tracker
# GROQ_API_KEY=your_groq_api_key_here
# PORT=5000
```

**For MongoDB:**

- If using MongoDB Compass locally: Use `mongodb://localhost:27017/task-tracker`
- If using MongoDB Atlas: Use your Atlas connection string

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# The app will run on http://localhost:3000 by default
```

### 4. Start MongoDB

**Option A: MongoDB Compass (Local)**

```bash
# Start MongoDB service
# On macOS:
brew services start mongodb-community

# On Windows:
# Start MongoDB service from Services

# On Linux:
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**

- No local installation needed
- Just use your Atlas connection string in `.env`

### 5. Run the Application

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

Server will start on http://localhost:5000

**Terminal 2 - Frontend:**

```bash
cd frontend
npm start
```

App will open on http://localhost:3000

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

## 🔌 API Endpoints

### Tasks

**GET /api/tasks**

- Get all tasks
- Response: Array of task objects

**GET /api/tasks/:id**

- Get single task
- Response: Task object

**POST /api/tasks**

- Create new task
- Body: `{ title, description, status, priority, dueDate }`
- Response: Created task object

**PUT /api/tasks/:id**

- Update task
- Body: `{ title, description, status, priority, dueDate }`
- Response: Updated task object

**DELETE /api/tasks/:id**

- Delete task
- Response: `{ message: "Task deleted successfully" }`

### Voice Input

**POST /api/voice/parse**

- Parse voice input to task
- Body: FormData with audio file
- Response:

```json
{
  "transcript": "transcribed text",
  "parsed": {
    "title": "extracted title",
    "description": "extracted description",
    "priority": "High",
    "status": "To Do",
    "dueDate": "2024-12-15T18:00:00.000Z"
  }
}
```

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

## 🤖 AI Tools Usage

### Tools Used

- **GitHub Copilot**: Code completion and boilerplate generation
- **ChatGPT**: Architecture planning, debugging, prompt engineering for Groq

### What They Helped With

1. **Boilerplate Code**: React component structure, Express routes
2. **Date Parsing Logic**: Complex relative date parsing function
3. **Groq Integration**: Prompts for task parsing, error handling
4. **UI/UX Design**: Tailwind CSS classes, responsive layout
5. **Debugging**: MongoDB connection issues, audio processing errors

### Notable Prompts

- "Extract task details from natural language text and return JSON with title, priority, status, and due date"
- "Parse relative dates like 'tomorrow evening', 'next Monday', 'in 3 days' to ISO format"

### Learnings

- AI tools significantly speed up development but require careful review
- Prompt engineering is crucial for accurate task extraction
- Combining multiple AI services (Whisper + LLM) provides better results than single-step processing

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

## 🐛 Troubleshooting

### MongoDB Connection Error

```bash
# Check if MongoDB is running
# macOS:
brew services list

# Linux:
sudo systemctl status mongod

# Start MongoDB if not running
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
```

### Groq API Error

- Verify your API key in `.env`
- Check your API quota at https://console.groq.com
- Ensure you're using the correct model names

### CORS Error

- Make sure backend is running on port 5000
- Check that frontend is using correct API URL
- Verify CORS is enabled in backend

### Voice Input Not Working

- Check browser permissions for microphone
- Use HTTPS (or localhost)
- Test with different browsers

## 👤 Author

Riya Shree

## 🙏 Acknowledgments

- Groq for amazing AI APIs
- MongoDB for database
- React and Tailwind CSS communities
