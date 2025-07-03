// Minimal Express backend for PDF upload and OpenAI API proxy
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';

// POST /upload: Accepts a PDF and sends it to OpenAI API
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const formData = new FormData();
    formData.append('file', require('fs').createReadStream(req.file.path), req.file.originalname);
    formData.append('purpose', 'assistants');

    const openaiRes = await axios.post('https://api.openai.com/v1/files', formData, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
    });
    // Optionally, you can now use the file id with the Assistants API for further processing
    res.json(openaiRes.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  } finally {
    require('fs').unlink(req.file.path, () => {}); // Clean up temp file
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`OpenAI backend running on port ${PORT}`);
}); 