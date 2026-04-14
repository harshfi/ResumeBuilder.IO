import { useState, useRef, useEffect, useCallback } from 'react';
import { pdf } from '@react-pdf/renderer';
import { ResumeDocument } from './MyDocument';
import { generateLatexSource } from './utils/latexGenerator.jsx';
import { LatexResumePreview } from './components/LatexResumePreview';

// ─── API base URL ──────────────────────────────────────────────────────────────
// In production (Vercel), VITE_API_URL points to the Render backend.
// In development, we use the Vite proxy ('/api' → localhost:3000).
const API_URL = import.meta.env.VITE_API_URL || '/api';

// ─── App Component ─────────────────────────────────────────────────────────────
function App() {
  const [leftWidth, setLeftWidth] = useState(42);
  const [isDragging, setIsDragging] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [error, setError] = useState(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Drag Logic (resizable panels) ─────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.min(75, Math.max(25, pct)));
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // ── File Handlers ──────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) { setUploadedFile(file); setError(null); }
  };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { setUploadedFile(file); setError(null); }
  };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Generate Resume — backend call ─────────────────────────────────────────
  const handleGenerate = async () => {
    if (!uploadedFile) { setError('Please upload a resume file first.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('uploaded_file', uploadedFile);
      formData.append('jobDescription', jobDescription);
      const response = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Server error: ${response.status} ${response.statusText}`);
      const data = await response.json();
      if (data.raw) {
        try { setResumeData(JSON.parse(data.raw)); }
        catch { throw new Error('The AI response could not be parsed. Please try again.'); }
      } else {
        setResumeData(data);
      }
    } catch (err) {
      console.error('Generate failed:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Update a field in resumeData by path ──────────────────────────────────
  const handleFieldUpdate = useCallback((path, newValue) => {
    setResumeData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      let obj = copy;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = newValue;
      return copy;
    });
  }, []);

  // ── Delete section or item from array ─────────────────────────────────────
  const handleDeleteSection = useCallback((key) => {
    setResumeData((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  }, []);

  const handleDeleteItem = useCallback((arrayKey, index, nestedPath) => {
    setResumeData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      let arr = copy;
      if (nestedPath) {
        for (const k of nestedPath) arr = arr[k];
      } else {
        arr = copy[arrayKey];
      }
      if (Array.isArray(arr)) arr.splice(index, 1);
      return copy;
    });
  }, []);

  // ── Download PDF ──────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    if (!resumeData || isPdfGenerating) return;
    setIsPdfGenerating(true);
    try {
      const blob = await pdf(<ResumeDocument data={resumeData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(resumeData.name || 'resume').replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // ── Download .tex ─────────────────────────────────────────────────────────
  const handleDownloadTex = () => {
    if (!resumeData) return;
    const tex = generateLatexSource(resumeData);
    const blob = new Blob([tex], { type: 'application/x-tex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(resumeData.name || 'resume').replace(/\s+/g, '_')}_Resume.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`app-container flex h-screen w-screen bg-gray-50 overflow-hidden font-['Inter',sans-serif] ${
        isDragging ? 'cursor-col-resize select-none' : ''
      }`}
    >
      {/* ═══════════════════ LEFT PANEL ═══════════════════════════════════ */}
      <div
        id="left-panel"
        style={{ width: `${leftWidth}%` }}
        className="h-full flex flex-col bg-white border-r border-gray-100"
      >
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center relative overflow-hidden shadow-lg shadow-blue-500/25">
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="1" width="12" height="16" rx="2" fill="white" opacity="0.15"/>
                <rect x="1" y="1" width="12" height="16" rx="2" fill="none" stroke="white" opacity="0.3" strokeWidth="0.8"/>
                <rect x="3" y="8"  width="6"  height="1.5" rx="0.75" fill="white" opacity="0.5"/>
                <rect x="3" y="11" width="8"  height="1.5" rx="0.75" fill="white" opacity="0.5"/>
                <polygon points="8,2 5,8 7.5,8 6,14 11,7 8.5,7" fill="white"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Resume Builder</h1>
              <p className="text-xs text-gray-400 font-medium">AI-powered • Tailored to the job</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Resume</label>
            <div
              onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50/50'
                  : uploadedFile
                    ? 'border-green-300 bg-green-50/30'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              {uploadedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{uploadedFile.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="text-sm text-gray-500">Drop your PDF here or <span className="text-blue-500 font-medium">browse</span></p>
                </>
              )}
            </div>
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here…"
              rows={8}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 resize-none transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGenerate}
              disabled={isLoading || !uploadedFile}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Generate Resume
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════ DIVIDER ═══════════════════════════════════════ */}
      <div
        className="w-1.5 cursor-col-resize bg-gray-100 hover:bg-blue-400 transition-colors duration-200 flex items-center justify-center group"
        onMouseDown={handleMouseDown}
      >
        <div className="w-0.5 h-8 bg-gray-300 group-hover:bg-white rounded-full transition-colors" />
      </div>

      {/* ═══════════════════ RIGHT PANEL ═══════════════════════════════════ */}
      <div
        id="right-panel"
        style={{ width: `${100 - leftWidth}%` }}
        className="h-full flex flex-col bg-gray-50"
      >
        {/* ── Sticky download toolbar ── */}
        {resumeData && (
          <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-md border-b border-gray-200/60 px-6 py-3 flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isPdfGenerating}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isPdfGenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
            <button
              onClick={handleDownloadTex}
              className="flex-1 py-2.5 px-4 rounded-xl font-medium text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Download .tex
            </button>
          </div>
        )}

        {/* ── Resume content ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {!resumeData ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
              <svg className="w-16 h-16 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-400 mb-1">No resume yet</h3>
              <p className="text-sm text-gray-400">
                Upload your resume and paste a job description, then click <span className="font-semibold text-blue-500">Generate</span> to get started.
              </p>
            </div>
          ) : (
            <LatexResumePreview
              data={resumeData}
              onUpdate={handleFieldUpdate}
              onDeleteSection={handleDeleteSection}
              onDeleteItem={handleDeleteItem}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
