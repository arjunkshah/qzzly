// Minimal Express backend for PDF upload and OpenAI API proxy
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Configure multer for Vercel serverless environment
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'openai-pdf-upload' });
});

// POST /api/upload: Accepts a PDF and sends it to OpenAI API
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  try {
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append('purpose', 'assistants');

    const openaiRes = await axios.post('https://api.openai.com/v1/files', formData, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
    });
    
    res.json(openaiRes.data);
  } catch (err) {
    console.error('OpenAI API error:', err.response?.data || err.message);
    res.status(500).json({ 
      error: err.response?.data?.error?.message || err.message 
    });
  }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`OpenAI backend running on port ${PORT}`);
  });
}

// For Vercel serverless
module.exports = app; 