import { highlightText } from '../utils/textUtils';
import { Editable, DeleteItemBtn, SectionHeader } from './EditableControls';
import {
  PhoneIcon, EnvelopeIcon, LinkedInIcon, GitHubIcon, GlobeIcon,
  PROFILE_ICON_MAP,
} from './Icons';

// ─── Profile link keys treated as contact-row items ──────────────────────────
const PROFILE_LINK_KEYS = [
  'leetcode', 'codechef', 'codeforces', 'hackerrank',
  'hackerearth', 'kaggle', 'medium', 'twitter', 'dribbble',
  'behance', 'stackoverflow', 'website',
];

const KNOWN_KEYS = new Set([
  'name','email','phone','location','linkedin','github','portfolio','title',
  'summary','skills','skill_categories','experience','education',
  'projects','certifications','languages','awards','volunteer',
  'jd_keywords','raw', ...PROFILE_LINK_KEYS,
]);

// ─── Format an object item into readable text ─────────────────────────────────
function formatObjectItem(obj) {
  if (!obj || typeof obj !== 'object') return String(obj);
  const vals = Object.values(obj).filter((v) => v && typeof v === 'string');
  if (vals.length === 0) return '';
  if (vals.length === 2) return vals.join(' — ');
  return vals.join(', ');
}

// ─── Render catch-all extra values (editable) ─────────────────────────────────
function ExtraValue({ value, hl, sectionKey, onUpdate, onDeleteItem }) {
  if (typeof value === 'string') {
    return (
      <Editable tag="p" className="text-[0.92em] leading-relaxed" value={value} onSave={(v) => onUpdate([sectionKey], v)}>
        {hl ? hl(value) : value}
      </Editable>
    );
  }
  if (Array.isArray(value)) {
    return (
      <ul className="latex-bullets">
        {value.map((item, i) => {
          let text;
          if (typeof item === 'string') text = item;
          else if (typeof item === 'object' && item !== null) text = formatObjectItem(item);
          else text = String(item);
          return (
            <li key={i} className="bullet-wrapper">
              <Editable tag="span" value={text} onSave={(v) => onUpdate([sectionKey, i], v)}>
                {hl ? hl(text) : text}
              </Editable>
              <DeleteItemBtn onClick={() => onDeleteItem(sectionKey, i)} title="Delete item" />
            </li>
          );
        })}
      </ul>
    );
  }
  if (typeof value === 'object' && value !== null) {
    return (
      <ul className="latex-bullets">
        {Object.entries(value).map(([k, v]) => {
          const display = typeof v === 'string' ? v
            : typeof v === 'object' ? formatObjectItem(v)
            : String(v);
          return (
            <li key={k} className="bullet-wrapper">
              <span className="font-bold">{k}</span>:{' '}
              <Editable tag="span" value={display} onSave={(newVal) => onUpdate([sectionKey, k], newVal)}>
                {hl ? hl(display) : display}
              </Editable>
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <Editable tag="p" className="text-[0.92em]" value={String(value)} onSave={(v) => onUpdate([sectionKey], v)}>
      {String(value)}
    </Editable>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ─── LaTeX-Styled Resume Preview ────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════
export function LatexResumePreview({ data, onUpdate, onDeleteSection, onDeleteItem }) {
  // Merge jd_keywords + skills for highlighting
  const keywords = [...new Set([
    ...(data.jd_keywords || []),
    ...(data.skills || []),
    ...(data.skill_categories ? Object.values(data.skill_categories).flat() : []),
  ])];
  const hl = (text) => highlightText(text, keywords);

  // Helper: save a field at a given path
  const save = (...path) => (newVal) => onUpdate(path, newVal);

  // Find extra sections
  const extraSections = Object.keys(data).filter((k) => !KNOWN_KEYS.has(k) && data[k]);

  return (
    <div
      id="resume-preview"
      className="latex-resume bg-white shadow-xl border border-gray-200 mx-auto mt-2 mb-6"
      style={{ maxWidth: '816px', padding: '48px 56px' }}
    >
      {/* ── HEADING ────────────────────────────────────────────────────── */}
      <div className="text-center mb-1">
        <h1 className="latex-name">
          <Editable value={data.name} onSave={save('name')}>{data.name}</Editable>
        </h1>
        {data.location && (
          <p className="text-[0.85em] mt-0.5">
            <Editable value={data.location} onSave={save('location')}>{data.location}</Editable>
          </p>
        )}
        <div className="latex-contact-row mt-1.5">
          {data.phone && <Editable tag="span" value={data.phone} onSave={save('phone')} className="flex items-center gap-1"><PhoneIcon />{data.phone}</Editable>}
          {data.email && <Editable tag="span" value={data.email} onSave={save('email')} className="flex items-center gap-1"><EnvelopeIcon />{data.email}</Editable>}
          {data.linkedin && <Editable tag="span" value={data.linkedin} onSave={save('linkedin')} className="flex items-center gap-1"><LinkedInIcon />{data.linkedin}</Editable>}
          {data.github && <Editable tag="span" value={data.github} onSave={save('github')} className="flex items-center gap-1"><GitHubIcon />{data.github}</Editable>}
          {data.portfolio && <Editable tag="span" value={data.portfolio} onSave={save('portfolio')} className="flex items-center gap-1"><GlobeIcon />{data.portfolio}</Editable>}
          {/* Extra profile links (LeetCode, CodeChef, etc.) */}
          {PROFILE_LINK_KEYS.map((key) => {
            if (!data[key]) return null;
            const IconComp = PROFILE_ICON_MAP[key] || GlobeIcon;
            return (
              <Editable key={key} tag="span" value={data[key]} onSave={save(key)} className="flex items-center gap-1">
                <IconComp />{data[key]}
              </Editable>
            );
          })}
        </div>
      </div>

      {/* ── SUMMARY ────────────────────────────────────────────────────── */}
      {data.summary && (
        <div className="entry-avoid-break">
          <SectionHeader title="Summary" onDelete={() => onDeleteSection('summary')} />
          <Editable tag="p" value={data.summary} onSave={save('summary')} className="text-[0.92em] leading-relaxed">{hl(data.summary)}</Editable>
        </div>
      )}

      {/* ── EDUCATION ──────────────────────────────────────────────────── */}
      {data.education?.length > 0 && (
        <>
          <SectionHeader title="Education" onDelete={() => onDeleteSection('education')} />
          {data.education.map((edu, i) => (
            <div key={i} className="mb-1 entry-avoid-break item-wrapper">
              <DeleteItemBtn onClick={() => onDeleteItem('education', i)} title="Delete this education" />
              <div className="latex-subheading-row">
                <Editable className="font-bold text-[0.95em]" value={edu.school || edu.institution || ''} onSave={save('education', i, 'school')}>{edu.school || edu.institution}</Editable>
                <Editable className="font-bold text-[0.85em]" value={edu.year || ''} onSave={save('education', i, 'year')}>{edu.year}</Editable>
              </div>
              <div className="latex-subheading-row">
                <Editable className="italic text-[0.85em]" value={edu.degree || ''} onSave={save('education', i, 'degree')}>{edu.degree}</Editable>
                <Editable className="italic text-[0.85em]" value={`${edu.location || ''}${edu.gpa ? ` — GPA: ${edu.gpa}` : ''}`} onSave={(v) => onUpdate(['education', i, 'location'], v)}>{edu.location}{edu.gpa && ` — GPA: ${edu.gpa}`}</Editable>
              </div>
            </div>
          ))}
          {data.education[0]?.coursework?.length > 0 && (
            <div className="entry-avoid-break">
              <SectionHeader title="Relevant Coursework" onDelete={() => {
                onUpdate(['education', 0, 'coursework'], []);
              }} />
              <ul className="latex-coursework-grid">
                {data.education[0].coursework.map((c, i) => (
                  <li key={i} className="item-wrapper">
                    <Editable value={c} onSave={save('education', 0, 'coursework', i)}>{c}</Editable>
                    <DeleteItemBtn onClick={() => onDeleteItem(null, i, ['education', 0, 'coursework'])} title="Remove course" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* ── EXPERIENCE ─────────────────────────────────────────────────── */}
      {data.experience?.length > 0 && (
        <>
          <SectionHeader title="Experience" onDelete={() => onDeleteSection('experience')} />
          {data.experience.map((exp, i) => (
            <div key={i} className="mb-2 entry-avoid-break item-wrapper">
              <DeleteItemBtn onClick={() => onDeleteItem('experience', i)} title="Delete this experience" />
              <div className="latex-subheading-row">
                <Editable className="font-bold text-[0.95em]" value={exp.company || ''} onSave={save('experience', i, 'company')}>{exp.company}</Editable>
                <Editable className="font-bold text-[0.85em]" value={exp.duration || ''} onSave={save('experience', i, 'duration')}>{exp.duration}</Editable>
              </div>
              <div className="latex-subheading-row">
                <Editable className="italic text-[0.85em]" value={exp.title || exp.role || ''} onSave={save('experience', i, 'title')}>{exp.title || exp.role}</Editable>
                <Editable className="italic text-[0.85em]" value={exp.location || ''} onSave={save('experience', i, 'location')}>{exp.location}</Editable>
              </div>
              {exp.bullets?.length > 0 && (
                <ul className="latex-bullets">
                  {exp.bullets.map((b, j) => (
                    <li key={j} className="bullet-wrapper">
                      <Editable tag="span" value={b} onSave={save('experience', i, 'bullets', j)}>{hl(b)}</Editable>
                      <DeleteItemBtn onClick={() => onDeleteItem(null, j, ['experience', i, 'bullets'])} title="Delete bullet" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── PROJECTS ───────────────────────────────────────────────────── */}
      {data.projects?.length > 0 && (
        <>
          <SectionHeader title="Projects" onDelete={() => onDeleteSection('projects')} />
          {data.projects.map((proj, i) => {
            const tech = Array.isArray(proj.techStack) ? proj.techStack.join(', ') : proj.tech || '';
            const bullets = proj.bullets?.length ? proj.bullets : proj.description ? [proj.description] : [];
            return (
              <div key={i} className="mb-2 entry-avoid-break item-wrapper">
                <DeleteItemBtn onClick={() => onDeleteItem('projects', i)} title="Delete this project" />
                <div className="latex-subheading-row">
                  <span className="text-[0.92em]">
                    <Editable className="font-bold" value={proj.name || ''} onSave={save('projects', i, 'name')}>{proj.name}</Editable>
                    {tech && <>{' | '}<Editable className="italic" value={tech} onSave={(v) => onUpdate(['projects', i, 'techStack'], v.split(',').map(s => s.trim()))}>{tech}</Editable></>}
                  </span>
                  {(proj.date || proj.year) && <Editable className="font-bold text-[0.85em]" value={proj.date || proj.year || ''} onSave={save('projects', i, 'date')}>{proj.date || proj.year}</Editable>}
                </div>
                {bullets.length > 0 && (
                  <ul className="latex-bullets">
                    {bullets.map((b, j) => (
                      <li key={j} className="bullet-wrapper">
                        <Editable tag="span" value={b} onSave={save('projects', i, 'bullets', j)}>{hl(b)}</Editable>
                        <DeleteItemBtn onClick={() => onDeleteItem(null, j, ['projects', i, 'bullets'])} title="Delete bullet" />
                      </li>
                    ))}
                  </ul>
                )}
                {proj.link && (proj.link.includes('.') || proj.link.startsWith('http')) && (
                  <p className="text-[0.85em] mt-0.5">
                    <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noopener noreferrer" className="underline">{proj.link}</a>
                  </p>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* ── TECHNICAL SKILLS (categorized or flat) ─────────────────────── */}
      {(data.skill_categories && Object.keys(data.skill_categories).length > 0) ? (
        <div className="entry-avoid-break">
          <SectionHeader title="Technical Skills" onDelete={() => { onDeleteSection('skill_categories'); onDeleteSection('skills'); }} />
          <ul className="latex-skills-list">
            {Object.entries(data.skill_categories).map(([cat, arr]) =>
              arr?.length > 0 && (
                <li key={cat} className="item-wrapper">
                  <DeleteItemBtn onClick={() => {
                    onUpdate(['skill_categories'], Object.fromEntries(
                      Object.entries(data.skill_categories).filter(([k]) => k !== cat)
                    ));
                  }} title={`Delete ${cat}`} />
                  <Editable
                    className="font-bold"
                    value={cat}
                    onSave={(newCat) => {
                      const updated = {};
                      for (const [k, v] of Object.entries(data.skill_categories)) {
                        updated[k === cat ? newCat : k] = v;
                      }
                      onUpdate(['skill_categories'], updated);
                    }}
                  >{cat}</Editable>:{' '}
                  <Editable
                    value={arr.join(', ')}
                    onSave={(v) => onUpdate(['skill_categories', cat], v.split(',').map(s => s.trim()).filter(Boolean))}
                  >
                    {arr.map((skill, i) => (
                      <span key={i}>
                        {i > 0 && ', '}
                        {data.jd_keywords?.some((k) => k.toLowerCase() === skill.toLowerCase())
                          ? <b>{skill}</b>
                          : skill
                        }
                      </span>
                    ))}
                  </Editable>
                </li>
              )
            )}
          </ul>
        </div>
      ) : data.skills?.length > 0 && (
        <div className="entry-avoid-break">
          <SectionHeader title="Technical Skills" onDelete={() => onDeleteSection('skills')} />
          <ul className="latex-skills-list">
            <li>
              <span className="font-bold">Skills</span>:{' '}
              <Editable
                value={data.skills.join(', ')}
                onSave={(v) => onUpdate(['skills'], v.split(',').map(s => s.trim()).filter(Boolean))}
              >
                {data.skills.map((skill, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    {data.jd_keywords?.some((k) => k.toLowerCase() === skill.toLowerCase())
                      ? <b>{skill}</b>
                      : skill
                    }
                  </span>
                ))}
              </Editable>
            </li>
          </ul>
        </div>
      )}

      {/* ── CERTIFICATIONS ─────────────────────────────────────────────── */}
      {data.certifications?.length > 0 && (
        <div className="entry-avoid-break">
          <SectionHeader title="Certifications" onDelete={() => onDeleteSection('certifications')} />
          {data.certifications.map((cert, i) => (
            <div key={i} className="mb-1 item-wrapper">
              <DeleteItemBtn onClick={() => onDeleteItem('certifications', i)} title="Delete certification" />
              {typeof cert === 'string' ? (
                <Editable tag="p" className="text-[0.92em]" value={cert} onSave={(v) => {
                  onUpdate(['certifications', i], v);
                }}>{cert}</Editable>
              ) : (
                <>
                  <div className="latex-subheading-row">
                    <Editable className="font-bold text-[0.95em]" value={cert.name || ''} onSave={save('certifications', i, 'name')}>{cert.name}</Editable>
                    <Editable className="font-bold text-[0.85em]" value={cert.year || ''} onSave={save('certifications', i, 'year')}>{cert.year}</Editable>
                  </div>
                  {cert.issuer && <Editable tag="p" className="italic text-[0.85em]" value={cert.issuer} onSave={save('certifications', i, 'issuer')}>{cert.issuer}</Editable>}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── LANGUAGES ──────────────────────────────────────────────────── */}
      {data.languages?.length > 0 && (
        <div className="entry-avoid-break">
          <SectionHeader title="Languages" onDelete={() => onDeleteSection('languages')} />
          <ul className="latex-skills-list">
            <li>
              <Editable value={data.languages.join(', ')} onSave={(v) => onUpdate(['languages'], v.split(',').map(s => s.trim()))}>
                {data.languages.join(', ')}
              </Editable>
            </li>
          </ul>
        </div>
      )}

      {/* ── AWARDS ─────────────────────────────────────────────────────── */}
      {data.awards?.length > 0 && (
        <div className="entry-avoid-break">
          <SectionHeader title="Awards" onDelete={() => onDeleteSection('awards')} />
          <ul className="latex-bullets">
            {data.awards.map((a, i) => {
              const text = typeof a === 'string' ? a : a.name || JSON.stringify(a);
              return (
                <li key={i} className="bullet-wrapper">
                  <Editable tag="span" value={text} onSave={(v) => onUpdate(['awards', i], v)}>{text}</Editable>
                  <DeleteItemBtn onClick={() => onDeleteItem('awards', i)} title="Delete award" />
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── VOLUNTEER / LEADERSHIP ─────────────────────────────────────── */}
      {data.volunteer?.length > 0 && (
        <>
          <SectionHeader title="Leadership / Extracurricular" onDelete={() => onDeleteSection('volunteer')} />
          {data.volunteer.map((vol, i) => (
            <div key={i} className="mb-2 entry-avoid-break item-wrapper">
              <DeleteItemBtn onClick={() => onDeleteItem('volunteer', i)} title="Delete this entry" />
              {typeof vol === 'string' ? (
                <Editable tag="p" className="text-[0.92em]" value={vol} onSave={save('volunteer', i)}>{vol}</Editable>
              ) : (
                <>
                  <div className="latex-subheading-row">
                    <Editable className="font-bold text-[0.95em]" value={vol.organization || vol.name || ''} onSave={save('volunteer', i, 'organization')}>{vol.organization || vol.name}</Editable>
                    <Editable className="font-bold text-[0.85em]" value={vol.duration || ''} onSave={save('volunteer', i, 'duration')}>{vol.duration}</Editable>
                  </div>
                  <div className="latex-subheading-row">
                    <Editable className="italic text-[0.85em]" value={vol.role || vol.title || ''} onSave={save('volunteer', i, 'role')}>{vol.role || vol.title}</Editable>
                    <Editable className="italic text-[0.85em]" value={vol.location || ''} onSave={save('volunteer', i, 'location')}>{vol.location}</Editable>
                  </div>
                  {vol.bullets?.length > 0 && (
                    <ul className="latex-bullets">
                      {vol.bullets.map((b, j) => (
                        <li key={j} className="bullet-wrapper">
                          <Editable tag="span" value={b} onSave={save('volunteer', i, 'bullets', j)}>{hl(b)}</Editable>
                          <DeleteItemBtn onClick={() => onDeleteItem(null, j, ['volunteer', i, 'bullets'])} title="Delete bullet" />
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── EXTRA SECTIONS (catch-all) ─────────────────────────────────── */}
      {extraSections.map((key) => {
        const value = data[key];
        const title = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (s) => s.toUpperCase())
          .replace(/_/g, ' ');

        return (
          <div key={key} className="entry-avoid-break">
            <SectionHeader title={title} onDelete={() => onDeleteSection(key)} />
            <ExtraValue value={value} hl={hl} sectionKey={key} onUpdate={onUpdate} onDeleteItem={onDeleteItem} />
          </div>
        );
      })}
    </div>
  );
}

export default LatexResumePreview;
