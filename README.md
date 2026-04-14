<div align="center">

# ⚡ AI Resume Builder

### Tailored resumes for every job description — powered by Google Gemini AI

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Upload-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com)

---

**Upload your existing resume + paste a job description → Get a perfectly tailored, ATS-optimized resume in seconds.**

</div>

---

## 🎯 The Problem

Manually tailoring your resume for every job application is **tedious and time-consuming**. Recruiters use Applicant Tracking Systems (ATS) that scan for specific keywords — if your resume doesn't match, it gets filtered out before a human ever sees it.

## 💡 The Solution

AI Resume Builder **automatically rewrites your resume** to match any job description while keeping all your real data intact. It:

- Extracts keywords from the JD and **bolds them** in your resume for ATS visibility
- Rewrites bullet points with **strong action verbs** and **quantified metrics**
- Reorganizes skills to **prioritize what the job asks for**
- Generates a **professional, LaTeX-styled PDF** — downloadable in one click

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **AI-Powered Tailoring** | Uses Google Gemini AI to rewrite summaries, experience bullets, and project descriptions to match the target job |
| 🔑 **ATS Keyword Optimization** | Extracts 15-30 keywords from the JD and bolds them throughout your resume |
| ✏️ **Inline Editing** | Click any text in the preview to edit it directly — no form fields needed |
| 📄 **PDF Download** | Generates a clean, professional PDF with selectable text and clickable links |
| 📝 **LaTeX Export** | Download the resume as a `.tex` file (Jake Gutierrez template) for further customization |
| 🗑️ **Section Management** | Delete entire sections or individual bullet points with one click |
| 🔗 **Smart Link Handling** | Full URLs for LinkedIn, GitHub, LeetCode, etc. with platform-specific icons |
| ☁️ **Cloud Storage** | Uploaded PDFs are stored on Cloudinary — works on any hosting platform |
| 📊 **Categorized Skills** | Skills automatically grouped into categories (Languages, Frameworks, Tools, etc.) |
| 📱 **Resizable Panels** | Drag the divider to resize the input and preview panels |

---

## 🖥️ Tech Stack

### Frontend
- **React 19** — UI library with hooks and functional components
- **Vite 8** — Lightning-fast dev server and build tool
- **TailwindCSS 4** — Utility-first CSS framework
- **@react-pdf/renderer** — Generates real PDF files with selectable text
- **Modular architecture** — Separate components for Icons, EditableControls, ResumePreview, etc.

### Backend
- **Express 5** — Lightweight Node.js server
- **Google Gemini AI** (`gemini-3-flash-preview`) — Powers the resume rewriting
- **pdf-parse** — Extracts text from uploaded PDF resumes
- **Cloudinary** — Cloud storage for uploaded files (deployment-ready)
- **Multer** — File upload middleware (memory storage, no local files)

---

## 📁 Project Structure

```
ResumeBuilder/
├── Backend/
│   ├── index.js              # Express server, Cloudinary upload, Gemini AI call
│   ├── prompt.js             # AI prompt engineering for resume generation
│   ├── .env                  # API keys (Gemini, Cloudinary)
│   └── package.json
│
├── Frontend/
│   ├── public/
│   │   └── favicon.svg       # Custom lightning-bolt document icon
│   ├── src/
│   │   ├── App.jsx           # Main app shell (state, layout, API calls)
│   │   ├── MyDocument.jsx    # PDF document template (@react-pdf/renderer)
│   │   ├── components/
│   │   │   ├── Icons.jsx             # SVG icons (LinkedIn, GitHub, LeetCode, etc.)
│   │   │   ├── EditableControls.jsx  # Editable text, delete buttons, section headers
│   │   │   └── LatexResumePreview.jsx # Full resume preview with inline editing
│   │   ├── utils/
│   │   │   ├── textUtils.jsx         # Keyword highlighting, LaTeX escaping
│   │   │   └── latexGenerator.jsx    # .tex file generation
│   │   ├── index.css         # Global styles
│   │   └── main.jsx          # React entry point
│   ├── index.html
│   └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **Google Gemini API Key** — [Get one here](https://aistudio.google.com/apikey)
- **Cloudinary Account** — [Sign up free](https://cloudinary.com)

### 1. Clone the repository

```bash
git clone https://github.com/harshfi/ResumeBuilder.IO.git
cd ResumeBuilder.IO
```

### 2. Set up the Backend

```bash
cd Backend
npm install
```

Create a `.env` file:

```env
apiKey=YOUR_GEMINI_API_KEY
Cloud_name=YOUR_CLOUDINARY_CLOUD_NAME
API_key=YOUR_CLOUDINARY_API_KEY
API_secret=YOUR_CLOUDINARY_API_SECRET
```

Start the backend:

```bash
npx nodemon index.js
```

The server will run on `http://localhost:3000`.

### 3. Set up the Frontend

```bash
cd Frontend
npm install
npm run dev
```

The app will open at `http://localhost:5173`.

### 4. Configure Vite Proxy

Make sure your `vite.config.js` proxies API calls to the backend:

```js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

---

## 🔄 How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Upload PDF  │────▶│  Parse Text  │────▶│  Gemini AI   │────▶│  JSON Data   │
│  + Job Desc  │     │  (pdf-parse) │     │  Rewrite &   │     │  (tailored   │
│              │     │              │     │  Optimize    │     │   resume)    │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                    │
                    ┌─────────────┐     ┌─────────────┐            │
                    │  Download   │◀────│  Live Preview │◀───────────┘
                    │  PDF / .tex │     │  (editable)  │
                    └─────────────┘     └─────────────┘
```

1. **Upload** your existing resume (PDF) and paste the target job description
2. **AI processes** the resume — extracts all data, identifies JD keywords, rewrites descriptions
3. **Preview** the tailored resume with bold keywords, categorized skills, and rewritten bullets
4. **Edit** anything inline by clicking directly on the text
5. **Download** as a professional PDF or LaTeX `.tex` file

---

## 🏆 Why Use This Over Other Resume Builders?

| Feature | AI Resume Builder | Generic Builders | Manual Editing |
|---|:---:|:---:|:---:|
| Tailored to specific JD | ✅ | ❌ | ⚠️ (manual) |
| ATS keyword optimization | ✅ | ❌ | ❌ |
| Preserves your real data | ✅ | ⚠️ | ✅ |
| Inline editing | ✅ | ⚠️ | ✅ |
| Professional PDF output | ✅ | ✅ | ❌ |
| LaTeX export | ✅ | ❌ | ❌ |
| Free & open-source | ✅ | ❌ | ✅ |
| No account required | ✅ | ❌ | ✅ |
| One-click generation | ✅ | ❌ | ❌ |

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `apiKey` | Google Gemini API key |
| `Cloud_name` | Cloudinary cloud name |
| `API_key` | Cloudinary API key |
| `API_secret` | Cloudinary API secret |

---

## 🛣️ Roadmap

- [ ] Multi-page PDF support improvements
- [ ] Resume templates (multiple designs)
- [ ] Cover letter generation
- [ ] LinkedIn import
- [ ] Resume scoring / ATS score preview
- [ ] Dark mode
- [ ] User accounts & saved resumes

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ by [Harsh Tripathi](https://github.com/harshfi)**

⭐ Star this repo if you found it useful!

</div>
