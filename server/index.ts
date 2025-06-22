import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { User } from '../src/types/user';
import { StudySession, ChatMessage, Flashcard } from '../src/types/session';

const app: Express = express();
const port = process.env.PORT || 3001;

// In-memory database with proper types
interface Database {
  users: User[];
  sessions: StudySession[];
  messages: Record<string, ChatMessage[]>;
}

const db: Database = {
  users: [],
  sessions: [],
  messages: {},
};

const apiRouter = express.Router();

app.use(cors());
app.use(express.json());

// --- Health Check ---
app.get('/', (req: Request, res: Response) => {
  res.send('Quiz.io server is running!');
});

// --- User Authentication Endpoints ---

// Get all users
apiRouter.get('/users', (req: Request, res: Response) => {
  res.json(db.users);
});

// Get user by ID
apiRouter.get('/users/:id', (req: Request, res: Response) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).send('User not found');
  }
});

// Create a new user (signup)
apiRouter.post('/users', (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }
  const existingUser = db.users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(409).send('User with this email already exists');
  }
  const newUser: User = {
    id: `user_${Date.now()}`,
    email,
    name: name || email,
    // @ts-expect-error - password is not part of the User type, but needed for login
    password,
    subscription: { plan: 'free', status: 'active', startDate: new Date().toISOString() },
    sessionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  res.status(201).json(newUser);
});

// Login
apiRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  // @ts-expect-error - password is not part of the User type, but needed for login
  const user = db.users.find((u) => u.email === email && u.password === password);
  if (user) {
    res.json(user);
  } else {
    res.status(401).send('Invalid email or password');
  }
});

// Increment session count
apiRouter.post('/users/:id/increment-session', (req: Request, res: Response) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (user) {
    user.sessionCount += 1;
    res.json(user);
  } else {
    res.status(404).send('User not found');
  }
});

// --- Session Management Endpoints ---

// Get all sessions
apiRouter.get('/sessions', (req: Request, res: Response) => {
  res.json(db.sessions);
});

// Get session by ID
apiRouter.get('/sessions/:id', (req: Request, res: Response) => {
  const session = db.sessions.find((s) => s.id === req.params.id);
  if (session) {
    res.json(session);
  } else {
    res.status(404).send('Session not found');
  }
});

// Create a new session
apiRouter.post('/sessions', (req: Request, res: Response) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).send('Title is required');
  }
  const newSession: StudySession = {
    id: `session_${Date.now()}`,
    title,
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: [],
    flashcards: [],
    quizzes: [],
    studyMaterials: [],
  };
  db.sessions.push(newSession);
  // Also initialize chat messages for this session
  db.messages[newSession.id] = [];
  res.status(201).json(newSession);
});

// Delete a session
apiRouter.delete('/sessions/:id', (req: Request, res: Response) => {
  const index = db.sessions.findIndex((s) => s.id === req.params.id);
  if (index !== -1) {
    db.sessions.splice(index, 1);
    delete db.messages[req.params.id];
    res.status(204).send();
  } else {
    res.status(404).send('Session not found');
  }
});

// Update a session
apiRouter.put('/sessions/:id', (req: Request, res: Response) => {
  const index = db.sessions.findIndex((s) => s.id === req.params.id);
  if (index !== -1) {
    db.sessions[index] = { ...db.sessions[index], ...req.body, updatedAt: new Date().toISOString() };
    res.json(db.sessions[index]);
  } else {
    res.status(404).send('Session not found');
  }
});

// Add a file to a session
apiRouter.post('/sessions/:id/files', (req: Request, res: Response) => {
  const index = db.sessions.findIndex((s) => s.id === req.params.id);
  if (index !== -1) {
    const newFile = { ...req.body, id: `file_${Date.now()}` };
    db.sessions[index].files.push(newFile);
    res.status(201).json(db.sessions[index]);
  } else {
    res.status(404).send('Session not found');
  }
});

// Remove a file from a session
apiRouter.delete('/sessions/:id/files/:fileId', (req: Request, res: Response) => {
  const index = db.sessions.findIndex((s) => s.id === req.params.id);
  if (index !== -1) {
    db.sessions[index].files = db.sessions[index].files.filter((f) => f.id !== req.params.fileId);
    res.json(db.sessions[index]);
  } else {
    res.status(404).send('Session not found');
  }
});

// --- Chat Message Endpoints ---

// Get chat messages for a session
apiRouter.get('/sessions/:id/messages', (req: Request, res: Response) => {
  const messages = db.messages[req.params.id];
  if (messages) {
    res.json(messages);
  } else {
    // If a session exists but has no messages, return an empty array
    const session = db.sessions.find((s) => s.id === req.params.id);
    if (session) {
      res.json([]);
    } else {
      res.status(404).send('Session not found');
    }
  }
});

// Add a chat message to a session
apiRouter.post('/sessions/:id/messages', (req: Request, res: Response) => {
  const { role, content } = req.body;
  if (!role || !content) {
    return res.status(400).send('Role and content are required');
  }

  const session = db.sessions.find((s) => s.id === req.params.id);
  if (!session) {
    return res.status(404).send('Session not found');
  }

  const newMessage: ChatMessage = {
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
apiRouter.post('/sessions/:id/flashcards', (req: Request, res: Response) => {
  const index = db.sessions.findIndex((s) => s.id === req.params.id);
  if (index !== -1) {
    const { flashcards } = req.body;
    const newFlashcards = flashcards.map((f: Omit<Flashcard, 'id'>) => ({ ...f, id: `fc_${Date.now()}_${Math.random()}` }));
    db.sessions[index].flashcards.push(...newFlashcards);
    res.status(201).json(db.sessions[index]);
  } else {
    res.status(404).send('Session not found');
  }
});

// Add a quiz to a session
apiRouter.post('/sessions/:id/quizzes', (req: Request, res: Response) => {
  const index = db.sessions.findIndex((s) => s.id === req.params.id);
  if (index !== -1) {
    const { quiz } = req.body;
    const newQuiz = { ...quiz, id: `quiz_${Date.now()}` };
    db.sessions[index].quizzes.push(newQuiz);
    res.status(201).json(db.sessions[index]);
  } else {
    res.status(404).send('Session not found');
  }
});

// Toggle flashcard mastery
apiRouter.put('/sessions/:sessionId/flashcards/:flashcardId/toggle-mastery', (req: Request, res: Response) => {
  const session = db.sessions.find((s) => s.id === req.params.sessionId);
  if (session) {
    const flashcard = session.flashcards.find((f) => f.id === req.params.flashcardId);
    if (flashcard) {
      flashcard.mastered = !flashcard.mastered;
      res.json(flashcard);
    } else {
      res.status(404).send('Flashcard not found');
    }
  } else {
    res.status(404).send('Session not found');
  }
});

app.use('/api', apiRouter);

// --- API Endpoints ---
// We will add endpoints for users, sessions, and messages here.

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default db; 