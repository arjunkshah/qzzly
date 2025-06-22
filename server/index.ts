import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app: Express = express();
const port = process.env.PORT || 3001;

// In-memory database
const db: { [key: string]: any } = {
  users: [],
  sessions: [],
  messages: {},
};

app.use(cors());
app.use(bodyParser.json());

// --- Health Check ---
app.get('/', (req: Request, res: Response) => {
  res.send('Quiz.io server is running!');
});

// --- User Authentication Endpoints ---

// Get all users
app.get('/users', (req: Request, res: Response) => {
  res.json(db.users);
});

// Get user by ID
app.get('/users/:id', (req: Request, res: Response) => {
  const user = db.users.find((u: any) => u.id === req.params.id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).send('User not found');
  }
});

// Create a new user (signup)
app.post('/users', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }
  const existingUser = db.users.find((u: any) => u.email === email);
  if (existingUser) {
    return res.status(409).send('User with this email already exists');
  }
  const newUser = {
    id: `user_${Date.now()}`,
    email,
    password, // In a real app, hash this!
    plan: 'free',
    sessionCount: 0,
  };
  db.users.push(newUser);
  res.status(201).json(newUser);
});

// Login
app.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = db.users.find((u: any) => u.email === email && u.password === password);
  if (user) {
    res.json(user);
  } else {
    res.status(401).send('Invalid email or password');
  }
});

// Increment session count
app.post('/users/:id/increment-session', (req: Request, res: Response) => {
  const user = db.users.find((u: any) => u.id === req.params.id);
  if (user) {
    user.sessionCount += 1;
    res.json(user);
  } else {
    res.status(404).send('User not found');
  }
});

// --- Session Management Endpoints ---

// Get all sessions
app.get('/sessions', (req: Request, res: Response) => {
  res.json(db.sessions);
});

// Get session by ID
app.get('/sessions/:id', (req: Request, res: Response) => {
  const session = db.sessions.find((s: any) => s.id === req.params.id);
  if (session) {
    res.json(session);
  } else {
    res.status(404).send('Session not found');
  }
});

// Create a new session
app.post('/sessions', (req: Request, res: Response) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).send('Title is required');
  }
  const newSession = {
    id: `session_${Date.now()}`,
    title,
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: [],
    flashcards: [],
    quizzes: [],
  };
  db.sessions.push(newSession);
  // Also initialize chat messages for this session
  db.messages[newSession.id] = [];
  res.status(201).json(newSession);
});

// Delete a session
app.delete('/sessions/:id', (req: Request, res: Response) => {
  const index = db.sessions.findIndex((s: any) => s.id === req.params.id);
  if (index !== -1) {
    db.sessions.splice(index, 1);
    delete db.messages[req.params.id];
    res.status(204).send();
  } else {
    res.status(404).send('Session not found');
  }
});

// Update a session
app.put('/sessions/:id', (req: Request, res: Response) => {
  const index = db.sessions.findIndex((s: any) => s.id === req.params.id);
  if (index !== -1) {
    db.sessions[index] = { ...db.sessions[index], ...req.body, updatedAt: new Date().toISOString() };
    res.json(db.sessions[index]);
  } else {
    res.status(404).send('Session not found');
  }
});

// Add a file to a session
app.post('/sessions/:id/files', (req: Request, res: Response) => {
  const index = db.sessions.findIndex((s: any) => s.id === req.params.id);
  if (index !== -1) {
    const newFile = { ...req.body, id: `file_${Date.now()}` };
    db.sessions[index].files.push(newFile);
    res.status(201).json(db.sessions[index]);
  } else {
    res.status(404).send('Session not found');
  }
});

// Remove a file from a session
app.delete('/sessions/:id/files/:fileId', (req: Request, res: Response) => {
  const index = db.sessions.findIndex((s: any) => s.id === req.params.id);
  if (index !== -1) {
    db.sessions[index].files = db.sessions[index].files.filter((f: any) => f.id !== req.params.fileId);
    res.json(db.sessions[index]);
  } else {
    res.status(404).send('Session not found');
  }
});

// --- Chat Message Endpoints ---

// Get chat messages for a session
app.get('/sessions/:id/messages', (req: Request, res: Response) => {
  const messages = db.messages[req.params.id];
  if (messages) {
    res.json(messages);
  } else {
    // If a session exists but has no messages, return an empty array
    const session = db.sessions.find((s: any) => s.id === req.params.id);
    if (session) {
      res.json([]);
    } else {
      res.status(404).send('Session not found');
    }
  }
});

// Add a chat message to a session
app.post('/sessions/:id/messages', (req: Request, res: Response) => {
  const { role, content } = req.body;
  if (!role || !content) {
    return res.status(400).send('Role and content are required');
  }

  const session = db.sessions.find((s: any) => s.id === req.params.id);
  if (!session) {
    return res.status(404).send('Session not found');
  }

  const newMessage = {
    id: `msg_${Date.now()}`,
    role,
    content,
    timestamp: new Date().toISOString(),
  };

  if (!db.messages[req.params.id]) {
    db.messages[req.params.id] = [];
  }
  db.messages[req.params.id].push(newMessage);

  res.status(201).json(newMessage);
});

// --- Flashcard and Quiz Endpoints ---

// Add flashcards to a session
app.post('/sessions/:id/flashcards', (req: Request, res: Response) => {
  const index = db.sessions.findIndex((s: any) => s.id === req.params.id);
  if (index !== -1) {
    const { flashcards } = req.body;
    const newFlashcards = flashcards.map((f: any) => ({ ...f, id: `fc_${Date.now()}_${Math.random()}` }));
    db.sessions[index].flashcards.push(...newFlashcards);
    res.status(201).json(db.sessions[index]);
  } else {
    res.status(404).send('Session not found');
  }
});

// Add a quiz to a session
app.post('/sessions/:id/quizzes', (req: Request, res: Response) => {
  const index = db.sessions.findIndex((s: any) => s.id === req.params.id);
  if (index !== -1) {
    const { quiz } = req.body;
    const newQuiz = { ...quiz, id: `quiz_${Date.now()}` };
    db.sessions[index].quizzes.push(newQuiz);
    res.status(201).json(db.sessions[index]);
  } else {
    res.status(404).send('Session not found');
  }
});

// --- API Endpoints ---
// We will add endpoints for users, sessions, and messages here.

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default db; 