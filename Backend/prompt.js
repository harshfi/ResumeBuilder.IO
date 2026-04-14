
function generateResume(resumeText, jobDescription) {
  const prompt = `
You are an expert ATS-optimized resume writer.

TASK:
1. Extract ALL information from the provided resume — do not drop any section, field, or data point
2. Rewrite bullet points, summary, and project descriptions to be ATS-friendly and tailored to the job description
3. Reorder skills to prioritize ones mentioned in the job description
4. Keep all factual data exactly as-is — only rewrite descriptive text
5. Identify important keywords from the job description that match the candidate's profile

Return ONLY a valid JSON object. The JSON must include every section present in the old resume.
Use this structure as a base, but ADD any extra sections you find in the resume:

{
  "name": "...",
  "email": "...",
  "phone": "...",
  "location": "...",
  "linkedin": "...",
  "github": "...",
  "portfolio": "...",
  "summary": "Rewritten 2-4 sentence professional summary targeting this specific job",
  "skill_categories": {
    "Languages": ["Python", "JavaScript", "..."],
    "Frameworks/Libraries": ["React", "Node.js", "..."],
    "Developer Tools": ["Git", "Docker", "VS Code", "..."],
    "Databases": ["MongoDB", "PostgreSQL", "..."],
    "Platforms/Technologies": ["AWS", "Linux", "CI/CD", "..."]
  },
  "skills": ["all skills as a flat array"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "duration": "Start Date -- End Date",
      "bullets": ["Achievement-oriented bullet 1", "Achievement-oriented bullet 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "school": "School name",
      "location": "City, State",
      "year": "Start -- End",
      "gpa": "X.X/10 or X.X/4.0",
      "coursework": ["Course 1", "Course 2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "techStack": ["Tech1", "Tech2"],
      "link": "https://...",
      "bullets": ["What you built/achieved 1", "Technical detail 2", "Impact/result 3"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "year": "Year"
    }
  ],
  "languages": ["English", "Hindi"],
  "awards": ["Award 1"],
  "volunteer": [
    {
      "organization": "Org Name",
      "role": "Role/Title",
      "duration": "Date Range",
      "location": "City, State",
      "bullets": ["What you did/achieved"]
    }
  ],
  "jd_keywords": ["keyword1", "React", "Node.js", "CI/CD", "agile", "..."]
}

IMPORTANT RULES:
- Never fabricate data. If a field is not in the old resume, omit it entirely — do not include it with empty or placeholder values
- If a section exists in the old resume but is not in the base structure above, still include it in the JSON with a sensible key name
- Rewrite ONLY: summary, experience bullets, project bullets
- Keep EXACTLY as-is: names, emails, phones, dates, company names, school names, links, tech stacks, certification names
- skill_categories: Group all skills into meaningful categories (Languages, Frameworks/Libraries, Developer Tools, Databases, Platforms/Technologies, etc.). Use 2-5 categories that make sense for the candidate's profile. Also provide the flat "skills" array
- jd_keywords: Extract 15-30 important keywords and phrases from the job description that are ALSO relevant to the candidate's resume. Include: programming languages, frameworks, tools, methodologies (Agile, Scrum, TDD), domain-specific terms, certifications, and key technical concepts. These will be bolded in the final resume for ATS visibility
- projects: Write 2-4 concise achievement-oriented bullet points per project (NOT a single paragraph). Each bullet should start with a strong action verb
- experience bullets: Start each bullet with a strong action verb, quantify impact with metrics where possible (%, numbers, time saved)
- Do NOT omit any section that exists in the original resume — preserve everything

OLD RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}
`;

  return prompt;
}

module.exports = generateResume;