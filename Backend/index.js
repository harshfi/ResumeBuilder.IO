const express= require('express')
const cors = require('cors')

const app= express();
const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.apiKey });
const { PDFParse } = require('pdf-parse');
const path= require('path')
const generateResume = require('./prompt.js')
const uuidv4 = require('uuid').v4;

uuidv4();  
const multer  = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './data')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
     const ext = path.extname(file.originalname) // gets .pdf
    cb(null, uuidv4() + ext)
  }
})

const upload = multer({ storage: storage })

// Enable CORS for frontend dev server
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 
app.post('/upload',upload.single('uploaded_file'),async (req,res)=>{
//    req.file is the name of your file in the form above, here 'uploaded_file'
//   req.body will hold the text fields, if there were any
const parser = new PDFParse({ url: path.join(__dirname, req.file.path) });
 
    const result = await parser.getText();
    const jobDescription = req.body.jobDescription  ;
    const resume = generateResume(result.text, jobDescription);
    console.log(resume);

    const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: resume,
    });

    // Strip markdown code fences if Gemini wraps the JSON in ```json ... ```
    let text = response.text;
    text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

    try {
      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (e) {
      // If parsing fails, send the raw text so the frontend can handle it
      console.error('Failed to parse Gemini response as JSON:', e.message);
      res.status(200).json({ raw: text });
    }
})



app.listen(3000,()=>{
    console.log("stated")
})