/**
 * MyDocument.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * @react-pdf/renderer document that mirrors the LaTeX-style resume preview.
 *
 * • All text is selectable (native PDF text, NOT an image).
 * • Links (email, LinkedIn, GitHub, portfolio) are clickable after download.
 * • Uses built-in Times-Roman font family (reliable, no external font loading).
 */

import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// ─── Disable hyphenation to avoid layout issues ──────────────────────────────
Font.registerHyphenationCallback((word) => [word]);

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 10.5,
    lineHeight: 1.35,
    color: '#000',
    paddingTop: 10,
    paddingBottom: 24,
    paddingHorizontal: 42,
  },

  // ── Header ──
  headerCenter: { alignItems: 'center', marginBottom: 2 },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    fontSize: 9,
    marginBottom: 2,
  },
  contactLink: { textDecoration: 'underline', color: '#2563EB' },
  contactSep: { color: '#666', marginHorizontal: 3 },

  // ── Section ──
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1.2,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    paddingBottom: 1,
    marginTop: 6,
    marginBottom: 3,
  },

  // ── Sub-heading row (company + date) ──
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  subLeft: { fontWeight: 'bold', fontSize: 10.5 },
  subRight: { fontWeight: 'bold', fontSize: 9 },
  subLeftItalic: { fontStyle: 'italic', fontSize: 9 },
  subRightItalic: { fontStyle: 'italic', fontSize: 9 },

  // ── Bullets ──
  bulletList: { marginTop: 1, marginBottom: 1, paddingLeft: 12 },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 1,
    fontSize: 9.5,
    lineHeight: 1.35,
  },
  bulletDot: { width: 10, textAlign: 'center', marginRight: 2 },
  bulletText: { flex: 1 },

  // ── Skills ──
  skillRow: { fontSize: 9.5, paddingLeft: 8, lineHeight: 1.5 },

  // ── Paragraph ──
  paragraph: { fontSize: 9.5, lineHeight: 1.4, marginBottom: 2 },

  // ── Bold / Italic inline ──
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },

  // ── Project heading ("Name | Tech") ──
  projectTitle: { fontSize: 10.5 },

  // ── Coursework grid ──
  courseworkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingLeft: 12,
    marginTop: 2,
  },
  courseworkItem: { width: '25%', fontSize: 9.5, marginBottom: 1 },
});

// ─── Highlight keywords with bold <Text> ─────────────────────────────────────
function BoldKeywords({ text, keywords }) {
  if (!keywords?.length || !text) return <Text>{text || ''}</Text>;
  const validKw = keywords.filter((k) => k && k.trim().length > 1);
  if (!validKw.length) return <Text>{text}</Text>;
  const escaped = validKw
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
  const parts = text.split(regex);
  const kwLower = new Set(validKw.map((k) => k.toLowerCase()));
  return (
    <Text>
      {parts.map((part, i) =>
        kwLower.has(part.toLowerCase())
          ? <Text key={i} style={s.bold}>{part}</Text>
          : <Text key={i}>{part}</Text>
      )}
    </Text>
  );
}

// ─── Bullet item ─────────────────────────────────────────────────────────────
function Bullet({ text, keywords }) {
  return (
    <View style={s.bulletItem}>
      <Text style={s.bulletDot}>•</Text>
      <View style={s.bulletText}>
        <BoldKeywords text={text} keywords={keywords} />
      </View>
    </View>
  );
}

// ─── Section title ───────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

// ─── URL helpers ─────────────────────────────────────────────────────────────
function ensureUrl(url) {
  if (!url) return '';
  return url.startsWith('http') ? url : `https://${url}`;
}

const PLATFORM_BASES = {
  linkedin: 'https://linkedin.com/in/',
  github: 'https://github.com/',
  leetcode: 'https://leetcode.com/',
  codechef: 'https://www.codechef.com/users/',
  codeforces: 'https://codeforces.com/profile/',
  hackerrank: 'https://www.hackerrank.com/profile/',
  hackerearth: 'https://www.hackerearth.com/@',
  kaggle: 'https://www.kaggle.com/',
  medium: 'https://medium.com/@',
  twitter: 'https://twitter.com/',
  dribbble: 'https://dribbble.com/',
  behance: 'https://www.behance.net/',
  stackoverflow: 'https://stackoverflow.com/users/',
  portfolio: 'https://',
  website: 'https://',
};

function buildProfileUrl(key, value) {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  if (value.includes('.')) return `https://${value}`;
  const base = PLATFORM_BASES[key];
  if (base) return `${base}${value}`;
  return `https://${value}`;
}

const PLATFORM_LABELS = {
  linkedin: 'LinkedIn', github: 'GitHub', leetcode: 'LeetCode',
  codechef: 'CodeChef', codeforces: 'Codeforces', hackerrank: 'HackerRank',
  hackerearth: 'HackerEarth', kaggle: 'Kaggle', medium: 'Medium',
  twitter: 'Twitter', dribbble: 'Dribbble', behance: 'Behance',
  stackoverflow: 'Stack Overflow', portfolio: 'Portfolio', website: 'Website',
};

function labelFromKey(key) {
  return PLATFORM_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

function urlToLabel(url) {
  if (!url) return url;
  const lower = url.toLowerCase();
  for (const [key, label] of Object.entries(PLATFORM_LABELS)) {
    if (lower.includes(key)) return label;
  }
  if (lower.includes('x.com')) return 'Twitter';
  return url;
}

function ContactEntry({ href, label, isFirst }) {
  return (
    <>
      {!isFirst ? <Text style={s.contactSep}>|</Text> : null}
      <Link src={href} style={s.contactLink}>{label}</Link>
    </>
  );
}

// ─── Known keys (used to detect extra/catch-all sections) ────────────────────
const KNOWN_KEYS = new Set([
  'name','email','phone','location','linkedin','github','portfolio','title',
  'summary','skills','skill_categories','experience','education',
  'projects','certifications','languages','awards','volunteer',
  'jd_keywords','raw',
  'leetcode','codechef','codeforces','hackerrank','hackerearth',
  'kaggle','medium','twitter','dribbble','behance','stackoverflow','website',
]);

const PROFILE_KEYS = [
  'leetcode','codechef','codeforces','hackerrank','hackerearth',
  'kaggle','medium','twitter','dribbble','behance','stackoverflow','website',
];

// ─── Extra section renderer (for unknown keys like coding_platforms) ─────────
function ExtraSection({ sectionKey, value, keywords }) {
  const title = sectionKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (ch) => ch.toUpperCase())
    .replace(/_/g, ' ');

  let content = null;

  if (typeof value === 'string') {
    content = <Text style={s.paragraph}>{value}</Text>;
  } else if (Array.isArray(value)) {
    content = (
      <View style={s.bulletList}>
        {value.map((item, i) => {
          let text;
          if (typeof item === 'string') {
            text = item;
          } else if (typeof item === 'object' && item !== null) {
            const vals = Object.values(item).filter((v) => v && typeof v === 'string');
            text = vals.length === 2 ? vals.join(' — ') : vals.join(', ');
          } else {
            text = String(item);
          }
          return <Bullet key={i} text={text || ''} keywords={keywords} />;
        })}
      </View>
    );
  } else if (typeof value === 'object' && value !== null) {
    content = (
      <View style={s.bulletList}>
        {Object.entries(value).map(([k, v]) => {
          const display = typeof v === 'string' ? v : String(v);
          return (
            <View key={k} style={s.bulletItem}>
              <Text style={s.bulletDot}>•</Text>
              <View style={s.bulletText}>
                <Text>
                  <Text style={s.bold}>{k}</Text>
                  <Text>{': ' + display}</Text>
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  } else {
    content = <Text style={s.paragraph}>{String(value)}</Text>;
  }

  return (
    <View minPresenceAhead={60}>
      <SectionTitle>{title}</SectionTitle>
      {content}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main Document Component ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export function ResumeDocument({ data }) {
  const keywords = [
    ...new Set([
      ...(data.jd_keywords || []),
      ...(data.skills || []),
      ...(data.skill_categories
        ? Object.values(data.skill_categories).flat()
        : []),
    ]),
  ];

  // Find extra sections not in known keys
  const extraSections = Object.keys(data).filter(
    (k) => !KNOWN_KEYS.has(k) && data[k]
  );

  return (
    <Document
      title={`${data.name || 'Resume'} - Resume`}
      author={data.name || ''}
      subject="Resume"
    >
      <Page size="LETTER" style={s.page} wrap>
        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <View style={s.headerCenter} fixed={false}>
          <Text style={s.name}>{data.name || ''}</Text>
          <View style={s.contactRow}>
            {(() => {
              const entries = [];
              if (data.phone) entries.push({ label: data.phone, href: `tel:${data.phone}` });
              if (data.email) entries.push({ label: data.email, href: `mailto:${data.email}` });
              if (data.linkedin) entries.push({ label: 'LinkedIn', href: buildProfileUrl('linkedin', data.linkedin) });
              if (data.github) entries.push({ label: 'GitHub', href: buildProfileUrl('github', data.github) });
              if (data.portfolio) entries.push({ label: 'Portfolio', href: buildProfileUrl('portfolio', data.portfolio) });
              for (const k of PROFILE_KEYS) {
                if (data[k]) entries.push({ label: labelFromKey(k), href: buildProfileUrl(k, data[k]) });
              }
              return entries.map((entry, i) => (
                <ContactEntry key={i} href={entry.href} label={entry.label} isFirst={i === 0} />
              ));
            })()}
          </View>
        </View>

        {/* ── SUMMARY ──────────────────────────────────────────────────── */}
        {data.summary ? (
          <View minPresenceAhead={60}>
            <SectionTitle>Summary</SectionTitle>
            <View style={s.paragraph}>
              <BoldKeywords text={data.summary} keywords={keywords} />
            </View>
          </View>
        ) : null}

        {/* ── EDUCATION ────────────────────────────────────────────────── */}
        {data.education?.length > 0 ? (
          <View minPresenceAhead={60}>
            <SectionTitle>Education</SectionTitle>
            {data.education.map((edu, i) => (
              <View key={i} style={{ marginBottom: 2 }} minPresenceAhead={30}>
                <View style={s.subRow}>
                  <Text style={s.subLeft}>{edu.school || edu.institution || ''}</Text>
                  <Text style={s.subRight}>{edu.year || ''}</Text>
                </View>
                <View style={s.subRow}>
                  <Text style={s.subLeftItalic}>{edu.degree || ''}</Text>
                  <Text style={s.subRightItalic}>
                    {edu.location || ''}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}
                  </Text>
                </View>
              </View>
            ))}
            {data.education[0]?.coursework?.length > 0 ? (
              <View>
                <SectionTitle>Relevant Coursework</SectionTitle>
                <View style={s.courseworkGrid}>
                  {data.education[0].coursework.map((c, i) => (
                    <Text key={i} style={s.courseworkItem}>• {c}</Text>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* ── EXPERIENCE ───────────────────────────────────────────────── */}
        {data.experience?.length > 0 ? (
          <View minPresenceAhead={60}>
            <SectionTitle>Experience</SectionTitle>
            {data.experience.map((exp, i) => (
              <View key={i} style={{ marginBottom: 3 }} minPresenceAhead={30}>
                <View style={s.subRow}>
                  <Text style={s.subLeft}>{exp.company || ''}</Text>
                  <Text style={s.subRight}>{exp.duration || ''}</Text>
                </View>
                <View style={s.subRow}>
                  <Text style={s.subLeftItalic}>{exp.title || exp.role || ''}</Text>
                  <Text style={s.subRightItalic}>{exp.location || ''}</Text>
                </View>
                {exp.bullets?.length > 0 ? (
                  <View style={s.bulletList}>
                    {exp.bullets.map((b, j) => (
                      <Bullet key={j} text={b} keywords={keywords} />
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* ── PROJECTS ─────────────────────────────────────────────────── */}
        {data.projects?.length > 0 ? (
          <View minPresenceAhead={60}>
            <SectionTitle>Projects</SectionTitle>
            {data.projects.map((proj, i) => {
              const tech = Array.isArray(proj.techStack)
                ? proj.techStack.join(', ')
                : proj.tech || '';
              const bullets = proj.bullets?.length
                ? proj.bullets
                : proj.description ? [proj.description] : [];
              return (
                <View key={i} style={{ marginBottom: 3 }} minPresenceAhead={30}>
                  <View style={s.subRow}>
                    <Text style={s.projectTitle}>
                      <Text style={s.bold}>{proj.name || ''}</Text>
                      {tech ? ' | ' : ''}
                      {tech ? <Text style={s.italic}>{tech}</Text> : null}
                    </Text>
                    {(proj.date || proj.year) ? (
                      <Text style={s.subRight}>{proj.date || proj.year || ''}</Text>
                    ) : null}
                  </View>
                  {bullets.length > 0 ? (
                    <View style={s.bulletList}>
                      {bullets.map((b, j) => (
                        <Bullet key={j} text={b} keywords={keywords} />
                      ))}
                    </View>
                  ) : null}
                  {proj.link && (proj.link.includes('.') || proj.link.startsWith('http')) ? (
                    <Text style={{ fontSize: 9, paddingLeft: 12 }}>
                      <Link
                        src={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                        style={s.contactLink}
                      >
                        {urlToLabel(proj.link)}
                      </Link>
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* ── TECHNICAL SKILLS ─────────────────────────────────────────── */}
        {data.skill_categories && Object.keys(data.skill_categories).length > 0 ? (
          <View minPresenceAhead={60}>
            <SectionTitle>Technical Skills</SectionTitle>
            {Object.entries(data.skill_categories).map(([cat, arr]) =>
              arr?.length > 0 ? (
                <Text key={cat} style={s.skillRow}>
                  <Text style={s.bold}>{cat}</Text>
                  {': ' + arr.join(', ')}
                </Text>
              ) : null
            )}
          </View>
        ) : data.skills?.length > 0 ? (
          <View minPresenceAhead={60}>
            <SectionTitle>Technical Skills</SectionTitle>
            <Text style={s.skillRow}>
              <Text style={s.bold}>Skills</Text>
              {': ' + data.skills.join(', ')}
            </Text>
          </View>
        ) : null}

        {/* ── CERTIFICATIONS ───────────────────────────────────────────── */}
        {data.certifications?.length > 0 ? (
          <View minPresenceAhead={60}>
            <SectionTitle>Certifications</SectionTitle>
            {data.certifications.map((cert, i) =>
              typeof cert === 'string' ? (
                <Text key={i} style={s.paragraph}>{cert}</Text>
              ) : (
                <View key={i} style={{ marginBottom: 2 }} minPresenceAhead={30}>
                  <View style={s.subRow}>
                    <Text style={s.subLeft}>{cert.name || ''}</Text>
                    <Text style={s.subRight}>{cert.year || ''}</Text>
                  </View>
                  {cert.issuer ? <Text style={s.subLeftItalic}>{cert.issuer}</Text> : null}
                </View>
              )
            )}
          </View>
        ) : null}

        {/* ── LANGUAGES ────────────────────────────────────────────────── */}
        {data.languages?.length > 0 ? (
          <View minPresenceAhead={60}>
            <SectionTitle>Languages</SectionTitle>
            <Text style={s.skillRow}>{data.languages.join(', ')}</Text>
          </View>
        ) : null}

        {/* ── AWARDS ───────────────────────────────────────────────────── */}
        {data.awards?.length > 0 ? (
          <View minPresenceAhead={60}>
            <SectionTitle>Awards</SectionTitle>
            <View style={s.bulletList}>
              {data.awards.map((a, i) => {
                const text = typeof a === 'string' ? a : a.name || JSON.stringify(a);
                return <Bullet key={i} text={text} keywords={keywords} />;
              })}
            </View>
          </View>
        ) : null}

        {/* ── VOLUNTEER / LEADERSHIP ────────────────────────────────────── */}
        {data.volunteer?.length > 0 ? (
          <View minPresenceAhead={60}>
            <SectionTitle>Leadership / Extracurricular</SectionTitle>
            {data.volunteer.map((vol, i) =>
              typeof vol === 'string' ? (
                <Text key={i} style={s.paragraph}>{vol}</Text>
              ) : (
                <View key={i} style={{ marginBottom: 3 }} minPresenceAhead={30}>
                  <View style={s.subRow}>
                    <Text style={s.subLeft}>{vol.organization || vol.name || ''}</Text>
                    <Text style={s.subRight}>{vol.duration || ''}</Text>
                  </View>
                  <View style={s.subRow}>
                    <Text style={s.subLeftItalic}>{vol.role || vol.title || ''}</Text>
                    <Text style={s.subRightItalic}>{vol.location || ''}</Text>
                  </View>
                  {vol.bullets?.length > 0 ? (
                    <View style={s.bulletList}>
                      {vol.bullets.map((b, j) => (
                        <Bullet key={j} text={b} keywords={keywords} />
                      ))}
                    </View>
                  ) : null}
                </View>
              )
            )}
          </View>
        ) : null}

        {/* ── EXTRA / CATCH-ALL SECTIONS ────────────────────────────────── */}
        {extraSections.map((key) => (
          <ExtraSection
            key={key}
            sectionKey={key}
            value={data[key]}
            keywords={keywords}
          />
        ))}
      </Page>
    </Document>
  );
}

export default ResumeDocument;
