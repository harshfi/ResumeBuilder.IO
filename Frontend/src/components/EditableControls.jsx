// ─── Editable inline text component ────────────────────────────────────────────
export function Editable({ value, onSave, className, tag: Tag = 'span', children }) {
  const handleBlur = (e) => {
    const newText = e.target.innerText.trim();
    if (newText !== value && onSave) onSave(newText);
  };
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      className={`editable-field ${className || ''}`}
    >
      {children || value}
    </Tag>
  );
}

// ─── Section delete button (×) ────────────────────────────────────────────────
export function DeleteSectionBtn({ onClick, title }) {
  return (
    <button
      onClick={onClick}
      className="section-delete-btn"
      title={title || 'Delete section'}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

// ─── Item delete button (smaller ×, for individual entries/bullets) ───────────
export function DeleteItemBtn({ onClick, title }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="item-delete-btn"
      title={title || 'Delete item'}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}

// ─── LaTeX-style section title ─────────────────────────────────────────────────
export function LatexSectionTitle({ children }) {
  return <h2 className="latex-section-title">{children}</h2>;
}

// ─── Section header with title + delete button ────────────────────────────────
export function SectionHeader({ title, onDelete }) {
  return (
    <div className="section-header-wrapper">
      <LatexSectionTitle>{title}</LatexSectionTitle>
      {onDelete && <DeleteSectionBtn onClick={onDelete} title={`Delete ${title}`} />}
    </div>
  );
}
