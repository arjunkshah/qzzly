import express from 'express';
import path from 'path';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import FormData from 'form-data';
import Stripe from 'stripe';
import multer from 'multer';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer();

// Middleware
app.use(cors({
  origin: ['https://qzzly.com', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Log all required environment variables at startup
console.log('--- ENVIRONMENT VARIABLES ---');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY);
console.log('STRIPE_PRICE_ID:', process.env.STRIPE_PRICE_ID);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('-----------------------------');

// Exit if any required env vars are missing
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY || !process.env.OPENAI_API_KEY || !process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID || !process.env.FRONTEND_URL) {
  console.error('ERROR: One or more required environment variables are missing. Exiting.');
  process.exit(1);
}

// API Routes
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const sessionId = req.body.sessionId;

    if (!file || !sessionId) {
      return res.status(400).json({ error: 'Missing file or sessionId' });
    }

    // Upload file to OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: 'Missing OpenAI API key' });
    }

    // Create FormData for OpenAI upload
    const formData = new FormData();
    formData.append('purpose', 'assistants');
    formData.append('file', file.buffer, file.originalname);

    const openaiResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
    }

    const openaiResult = await openaiResponse.json();
    console.log('PDF uploaded to OpenAI:', openaiResult);

    // Extract content from the file (simplified)
    const extractedContent = `Content extracted from ${file.originalname}. File ID: ${openaiResult.id}`;

    // Save file info to Supabase
    const { data: savedFile, error: dbError } = await supabase
      .from('files')
      .insert([{
        name: file.originalname,
        type: file.mimetype,
        content: extractedContent,
        session_id: sessionId,
        uploadedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to save file to database' });
    }

    res.json({
      success: true,
      file: savedFile,
      openaiFileId: openaiResult.id,
      extractedContent: extractedContent
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      details: error.message 
    });
  }
});

// Stripe checkout endpoint
app.post('/api/stripe/checkout', async (req, res) => {
  try {
    const { email } = req.body;
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: process.env.STRIPE_PRICE_ID, // Your $9.99/month price ID
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      customer_email: email,
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Stripe checkout failed' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 