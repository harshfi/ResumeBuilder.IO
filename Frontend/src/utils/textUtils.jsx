// ─── Highlight JD keywords in text (returns JSX with <b> tags) ─────────────────
export function highlightText(text, keywords) {
  if (!keywords?.length || !text) return text;

  const validKw = keywords.filter((k) => k && k.trim().length > 1);
  if (!validKw.length) return text;

  // Sort longest-first so "JavaScript" matches before "Java"
  const escaped = validKw
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  // Use word boundaries to avoid partial matches
  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const parts = text.split(regex);
  const kwLower = new Set(validKw.map((k) => k.toLowerCase()));

  return parts.map((part, i) =>
    kwLower.has(part.toLowerCase()) ? (
      <b key={i}>{part}</b>
    ) : (
      part
    )
  );
}

// ─── LaTeX special character escaping ──────────────────────────────────────────
export function escapeLatex(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

// ─── Escape LaTeX AND bold JD keywords with \textbf ────────────────────────────
export function texBoldKeywords(text, keywords) {
  if (!text) return '';
  if (!keywords?.length) return escapeLatex(text);

  const validKw = keywords.filter((k) => k && k.trim().length > 1);
  if (!validKw.length) return escapeLatex(text);

  const escaped = validKw
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const parts = text.split(regex);
  const kwLower = new Set(validKw.map((k) => k.toLowerCase()));

  return parts
    .map((part) =>
      kwLower.has(part.toLowerCase())
        ? `\\textbf{${escapeLatex(part)}}`
        : escapeLatex(part)
    )
    .join('');
}
