import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  const [mobileTab, setMobileTab] = useState('configure'); // 'configure' | 'preview'
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Mobile breakpoint detection ────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Auto-switch to preview tab when resume is generated on mobile
  useEffect(() => {
    if (isMobile && resumeData) setMobileTab('preview');
  }, [resumeData, isMobile]);

  // ── Drag Logic (resizable panels) ─────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (isMobile) return;
    e.preventDefault();
    setIsDragging(true);
  }, [isMobile]);

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
      className={`app-container ${isMobile ? 'mobile-layout' : 'desktop-layout'} font-['Inter',sans-serif] ${
        isDragging ? 'cursor-col-resize select-none' : ''
      }`}
    >
      {/* ═══════════ MOBILE TAB BAR ═══════════════════════════════════════ */}
      {isMobile && (
        <div className="mobile-tab-bar">
          <button
            className={`mobile-tab ${mobileTab === 'configure' ? 'active' : ''}`}
            onClick={() => setMobileTab('configure')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configure
          </button>
          <button
            className={`mobile-tab ${mobileTab === 'preview' ? 'active' : ''}`}
            onClick={() => setMobileTab('preview')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Preview
            {resumeData && <span className="mobile-tab-badge">●</span>}
          </button>
        </div>
      )}
      {/* ═══════════════════ LEFT PANEL ═══════════════════════════════════ */}
      <div
        id="left-panel"
        style={isMobile ? {} : { width: `${leftWidth}%` }}
        className={`left-panel-inner ${
          isMobile ? (mobileTab === 'configure' ? 'mobile-panel-visible' : 'mobile-panel-hidden') : ''
        }`}
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

        {/* ── Follow & Connect ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Follow & Connect</p>
          <div className="flex gap-2">
            <a
              href="https://www.instagram.com/harsh_tripathi_2210?igsh=bGttcXFsemZybjhw"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-white transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Instagram
            </a>
            <a
              href="https://www.linkedin.com/in/harsh-tripathi-00017a221/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-white bg-[#0A66C2] hover:bg-[#004182] transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      {/* ═══════════════════ DIVIDER ═══════════════════════════════════════ */}
      {!isMobile && (
        <div
          id="panel-divider"
          className="w-1.5 cursor-col-resize bg-gray-100 hover:bg-blue-400 transition-colors duration-200 flex items-center justify-center group"
          onMouseDown={handleMouseDown}
        >
          <div className="w-0.5 h-8 bg-gray-300 group-hover:bg-white rounded-full transition-colors" />
        </div>
      )}

      {/* ═══════════════════ RIGHT PANEL ═══════════════════════════════════ */}
      <div
        id="right-panel"
        style={isMobile ? {} : { width: `${100 - leftWidth}%` }}
        className={`right-panel-inner ${
          isMobile ? (mobileTab === 'preview' ? 'mobile-panel-visible' : 'mobile-panel-hidden') : ''
        }`}
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
