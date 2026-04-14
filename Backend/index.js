const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const { PDFParse } = require('pdf-parse');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const generateResume = require('./prompt.js');

require('dotenv').config();

// ─── Cloudinary config ───────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.Cloud_name,
  api_key: process.env.API_key,
  api_secret: process.env.API_secret,
});

// ─── Gemini AI ───────────────────────────────────────────────────────────────
const ai = new GoogleGenAI({ apiKey: process.env.apiKey });

// ─── Multer — memory storage (no local files) ───────────────────────────────
const upload = multer({ storage: multer.memoryStorage() });

// ─── Express ─────────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Upload & Generate Resume ────────────────────────────────────────────────
app.post('/upload', upload.single('uploaded_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // 1. Upload the PDF to Cloudinary (for storage / record-keeping)
    const cloudinaryUpload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',          // PDFs are "raw" files, not images
          folder: 'resume-builder',
          public_id: `resume_${Date.now()}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    console.log('Uploaded to Cloudinary:', cloudinaryUpload.secure_url);

    // 2. Parse PDF text directly from the in-memory buffer
    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();

    // 3. Build the AI prompt
    const jobDescription = req.body.jobDescription;
    const resume = generateResume(result.text, jobDescription);
    console.log('Prompt built, calling Gemini...');

    // 4. Call Gemini AI
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: resume,
    });

    // 5. Strip markdown code fences if Gemini wraps the JSON in ```json ... ```
    let text = response.text;
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

    // 6. Parse and return JSON
    try {
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON:', e.message);
      res.status(200).json({ raw: text });
    }
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ error: 'Failed to process resume: ' + error.message });
  }
});

// ─── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});