import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { User } from '../src/types/user';
import { StudySession, ChatMessage, Flashcard } from '../src/types/session';
import dotenv from 'dotenv';
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// --- Supabase Setup ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
let supabase: ReturnType<typeof createClient>;
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Warning: SUPABASE_URL or SUPABASE_ANON_KEY not set. Supabase will not be available.');
  supabase = {
    from: () => ({ select: async () => ({ data: [], error: { message: 'Supabase not configured' } }), insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }), update: async () => ({ data: null, error: { message: 'Supabase not configured' } }), delete: async () => ({ error: { message: 'Supabase not configured' } }) })
  } as any;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// --- Stripe Setup (placeholder) ---
const stripeSecret = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | any;
if (!stripeSecret) {
  console.warn('Warning: STRIPE_SECRET_KEY not set. Stripe will not be available.');
  stripe = {};
} else {
  stripe = new Stripe(stripeSecret);
}

const apiRouter = express.Router();

app.use(cors());
app.use(express.json());

// --- Health Check ---
app.get('/', (req: Request, res: Response) => {
  res.send('Qzzly server is running!');
});

// --- User Authentication Endpoints (Supabase) ---

// Get all users
apiRouter.get('/users', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get user by ID
apiRouter.get('/users/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// Create a new user (signup) - both /users and /auth/signup routes
apiRouter.post('/users', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }
  // Check if user exists
  const { data: existing, error: findErr } = await supabase.from('users').select('*').eq('email', email).single();
  if (existing) return res.status(409).send('User with this email already exists');
  const { data, error } = await supabase.from('users').insert([
    {
      email,
      name: name || email,
      password, // NOTE: Store hashed in production!
      subscription: { plan: 'free', status: 'active', startDate: new Date().toISOString() },
      sessionCount: 0,
    },
  ]).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

apiRouter.post('/auth/signup', async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }
  // Check if user exists
  const { data: existing, error: findErr } = await supabase.from('users').select('*').eq('email', email).single();
  if (existing) return res.status(409).send('User with this email already exists');
  const { data, error } = await supabase.from('users').insert([
    {
      email,
      name: name || email,
      password, // NOTE: Store hashed in production!
      subscription: { plan: 'free', status: 'active', startDate: new Date().toISOString() },
      sessionCount: 0,
    },
  ]).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Login
apiRouter.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).single();
  if (error || !data) return res.status(401).send('Invalid email or password');
  res.json(data);
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password', password).single();
  if (error || !data) return res.status(401).send('Invalid email or password');
  res.json(data);
});

// Increment session count
apiRouter.post('/users/:id/increment-session', async (req: Request, res: Response) => {
  const { data: user, error } = await supabase.from('users').select('*').eq('id', req.params.id).single();
  if (!user) return res.status(404).send('User not found');
  const sessionCount = (user as any).sessionCount || 0;
  const { data, error: updateErr } = await supabase.from('users').update({ sessionCount: sessionCount + 1 }).eq('id', req.params.id).select('*').single();
  if (updateErr) return res.status(500).json({ error: updateErr.message });
  res.json(data);
});

// --- Session Management Endpoints (Supabase) ---

// Get all sessions
apiRouter.get('/sessions', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('sessions').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get session by ID
apiRouter.get('/sessions/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('sessions').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// Create a new session
apiRouter.post('/sessions', async (req: Request, res: Response) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).send('Title is required');
  }
  const { data, error } = await supabase.from('sessions').insert([
    {
      title,
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files: [],
      flashcards: [],
      quizzes: [],
      studyMaterials: [],
    },
  ]).select('*').single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Delete a session
apiRouter.delete('/sessions/:id', async (req: Request, res: Response) => {
  const { error } = await supabase.from('sessions').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ error: error.message });
  res.status(204).send();
});

// Update a session
apiRouter.put('/sessions/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabase.from('sessions').update({ ...req.body, updatedAt: new Date().toISOString() }).eq('id', req.params.id).select('*').single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

// --- Custom Logic: Flashcards, Quizzes, Stripe ---
// (Keep these endpoints as custom logic, using Supabase for storage if needed)

// Add flashcards to a session (custom logic)
apiRouter.post('/sessions/:id/flashcards', async (req: Request, res: Response) => {
  // Custom flashcard generation logic here
  res.status(501).json({ error: 'Not implemented yet (custom logic placeholder)' });
});

// Add a quiz to a session (custom logic)
apiRouter.post('/sessions/:id/quizzes', async (req: Request, res: Response) => {
  // Custom quiz generation logic here
  res.status(501).json({ error: 'Not implemented yet (custom logic placeholder)' });
});

// Stripe payment endpoint (real implementation)
apiRouter.post('/stripe/checkout', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!stripeSecret || !stripe) return res.status(500).json({ error: 'Stripe not configured' });
    if (!email) return res.status(400).json({ error: 'Email required' });
    // Replace with your actual Stripe price ID for $9.99/month
    const priceId = 'price_1ReOtJBQXLankofpN65ovmWQ';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: 'https://quizio-ai-study.surge.sh/success',
      cancel_url: 'https://quizio-ai-study.surge.sh/cancel',
    });
    res.json({ sessionId: session.id });
  } catch (err) {
    let message = 'Unknown error';
    if (err instanceof Error) message = err.message;
    res.status(500).json({ error: 'Stripe checkout error', details: message });
  }
});

app.use('/api', apiRouter);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

export default supabase;        