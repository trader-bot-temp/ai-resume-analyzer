const express = require("express");
const multer = require("multer");
const extractText = require("./pdf");
const callGemini = require("./gemini");

const app = express();

// ================= CORS =================
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ================= MULTER =================
const upload = multer({ storage: multer.memoryStorage() });

// ================= HEALTH =================
app.get("/", (req, res) => {
  res.send("Backend running");
});

// ================= OLD SINGLE ANALYZE =================
app.post(
  "/analyze",
  upload.fields([{ name: "resume" }, { name: "jd" }]),
  async (req, res) => {
    try {
      console.log("🔥 ANALYZE HIT");

      const resumeFile = req.files.resume[0];
      const jdFile = req.files.jd[0];

      const resumeText = await extractText(
        resumeFile.buffer,
        resumeFile.mimetype,
        resumeFile.originalname
      );

      const jdText = await extractText(
        jdFile.buffer,
        jdFile.mimetype,
        jdFile.originalname
      );

      const prompt = `
Return ONLY JSON:
{
  "score": number,
  "strengths": [],
  "missing_skills": [],
  "questions": []
}

JOB DESCRIPTION:
${jdText}

RESUME:
${resumeText}
`;

      const result = await callGemini(prompt);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      console.error("❌ ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ================= MULTI RESUME ANALYZE (ATS UPGRADED) =================
app.post(
  "/analyze-multiple",
  upload.fields([{ name: "resumes" }, { name: "jd" }]),
  async (req, res) => {
    try {
      console.log("🔥 MULTI ANALYZE HIT");

      if (!req.files || !req.files.resumes || !req.files.jd) {
        return res.status(400).json({ error: "Missing files" });
      }

      const jdFile = req.files.jd[0];

      const jdText = await extractText(
        jdFile.buffer,
        jdFile.mimetype,
        jdFile.originalname
      );

      const results = [];

      for (const file of req.files.resumes.slice(0, 5)) {
        const resumeText = await extractText(
          file.buffer,
          file.mimetype,
          file.originalname
        );

        // ================= ATS PROMPT =================
        const prompt = `
You are an expert resume screening AI with deep knowledge across ALL professional domains — technology, sales, marketing, finance, healthcare, mechanical engineering, cloud computing, data science, operations, HR, legal, and every other field. You evaluate resumes the way a seasoned recruiter would: understanding intent, context, and transferable skills — never relying on exact keyword matches.

═══════════════════════════════════════════════════════════════
                        YOUR TASK
═══════════════════════════════════════════════════════════════

Analyze the provided RESUME against the JOB DESCRIPTION and produce a detailed scoring evaluation.

═══════════════════════════════════════════════════════════════
                    SCORING CRITERIA
═══════════════════════════════════════════════════════════════

1. EXPERIENCE MATCH (40% weight)
   Evaluate:
   - Years of experience vs. JD requirement (consider ranges, not exact matches)
   - Domain/industry relevance (direct experience OR transferable experience)
   - Role similarity (title may differ, but responsibilities align)
   - Career progression and seniority level fit
   - Quality of experience (reputable companies, impactful projects)

2. SKILL MATCH (40% weight)
   Evaluate:
   - Core competencies required by the JD
   - SEMANTIC matching — understand equivalences:
     • "data visualization" ≈ "dashboarding" ≈ "reporting" ≈ "BI development"
     • "stakeholder management" ≈ "client communication" ≈ "cross-functional collaboration"
     • "agile methodology" ≈ "scrum" ≈ "sprint planning" ≈ "iterative development"
     • "cloud infrastructure" ≈ "AWS/Azure/GCP" ≈ "cloud architecture"
   - Transferable skills that apply even if not explicitly named
   - Soft skills alignment (leadership, communication, problem-solving)
   - Certifications and formal qualifications

3. TOOLS & TECHNOLOGY MATCH (20% weight)
   Evaluate:
   - Specific tools, platforms, software mentioned in JD
   - Equivalent/competing tools (e.g., Tableau ≈ Power BI ≈ Looker)
   - Programming languages and frameworks
   - Industry-specific systems (ERP, CRM, CAD, etc.)
   - Learnability — if candidate shows aptitude for similar tools

═══════════════════════════════════════════════════════════════
                    SCORING GUIDELINES
═══════════════════════════════════════════════════════════════

SCORE DISTRIBUTION (be realistic like a human recruiter):
- 90-100: Exceptional match — rare, near-perfect alignment
- 75-89:  Strong match — highly qualified, minor gaps only
- 60-74:  Good match — solid candidate, some development needed
- 45-59:  Partial match — meets some criteria, notable gaps
- 30-44:  Weak match — significant gaps, may need training
- 20-29:  Poor match — minimal alignment, not recommended

STRICT RULES:
✗ NEVER score below 20 (everyone has some baseline value)
✗ NEVER score above 90 unless truly exceptional
✗ NEVER match exact keywords only — always use semantic understanding
✗ NEVER inflate scores — most resumes should fall between 50-85
✓ BE FAIR but strict — emulate a real recruiter's judgment
✓ CONSIDER context: a 3-year experienced candidate isn't "missing" senior skills
✓ WEIGHT criticality: missing a "must-have" hurts more than missing a "nice-to-have"

═══════════════════════════════════════════════════════════════
                    SKILL EXTRACTION RULES
═══════════════════════════════════════════════════════════════

For MATCHED SKILLS:
- Include skills present in resume that align with JD requirements
- Include semantic equivalents (note the equivalence if applicable)
- Include transferable skills that satisfy the JD intent

For MISSING SKILLS:
- List only skills ACTUALLY required by the JD that are absent
- Distinguish between "must-have" and "nice-to-have" if JD indicates priority
- Don't list advanced skills as "missing" if JD is for a junior role
- Consider if the skill could be reasonably inferred from related experience

═══════════════════════════════════════════════════════════════
                    OUTPUT FORMAT
═══════════════════════════════════════════════════════════════

Return ONLY valid JSON — no markdown, no explanation, no preamble:

{
  "score": <number 20-100>,
  "experience_match": <number 0-100>,
  "skill_match": <number 0-100>,
  "tools_match": <number 0-100>,
  "matched_skills": [
    "<skill 1>",
    "<skill 2 (equivalent: resume term)>",
    ...
  ],
  "missing_skills": [
    "<skill 1> [must-have]",
    "<skill 2> [nice-to-have]",
    ...
  ],
  "summary": "<2-3 sentence recruiter-style evaluation — mention strengths, gaps, and hiring recommendation>"
}

═══════════════════════════════════════════════════════════════
                    INPUT DATA
═══════════════════════════════════════════════════════════════

JOB DESCRIPTION:
"""
{jd_text}
"""

RESUME:
"""
{resume_text}
"""

Now analyze and return the JSON output.

================ DATA =================

JOB DESCRIPTION:
${jdText}

RESUME:
${resumeText}
`;

        const result = await callGemini(prompt);

        let parsed;

        try {
          const clean = result
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

          parsed = JSON.parse(clean);
        } catch (err) {
          console.log("⚠️ JSON parse failed:", result);

          parsed = {
            score: 20,
            experience_match: 20,
            skill_match: 20,
            tools_match: 20,
            matched_skills: [],
            missing_skills: [],
            summary: "Parsing failed",
          };
        }

        results.push({
          name: file.originalname,
          ...parsed,
        });
      }

      // sort by score DESC
      results.sort((a, b) => b.score - a.score);

      res.json({
        success: true,
        results,
      });
    } catch (err) {
      console.error("❌ ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ================= START =================
app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});