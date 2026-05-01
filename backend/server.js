const express = require("express");
const multer = require("multer");
const extractText = require("./pdf");
const callGemini = require("./gemini");

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  next();
});


// ================= SAFE JSON PARSE =================
app.use(express.json({ limit: "10mb" }));

// ================= CORS (CLEAN VERSION) =================
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ================= MULTER =================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB safety
});

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({ status: "Backend running 🚀" });
});


// =====================================================
// 1. SINGLE ANALYZE (KEEP FOR OLD UI)
// =====================================================
app.post(
  "/analyze",
  upload.fields([{ name: "resume" }, { name: "jd" }]),
  async (req, res) => {
    try {
      if (!req.files?.resume || !req.files?.jd) {
        return res.status(400).json({ error: "Missing files" });
      }

      const resumeText = await extractText(
        req.files.resume[0].buffer,
        req.files.resume[0].mimetype,
        req.files.resume[0].originalname
      );

      const jdText = await extractText(
        req.files.jd[0].buffer,
        req.files.jd[0].mimetype,
        req.files.jd[0].originalname
      );

      const prompt = `
Return ONLY JSON:
{
  "score": number,
  "strengths": [],
  "missing_skills": [],
  "questions": []
}

JOB:
${jdText}

RESUME:
${resumeText}
`;

      const result = await callGemini(prompt);

      let parsed;

      try {
        parsed = JSON.parse(
          result.replace(/```json/g, "").replace(/```/g, "").trim()
        );
      } catch {
        parsed = {
          error: true,
          message: "AI response parsing failed",
        };
      }

      res.json({ success: true, data: parsed });
    } catch (err) {
      console.error("ANALYZE ERROR:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);


// =====================================================
// 2. MULTI RESUME ANALYZE (MAIN FEATURE)
// =====================================================
app.post(
  "/analyze-multiple",
  upload.fields([{ name: "resumes" }, { name: "jd" }]),
  async (req, res) => {
    try {
      if (!req.files?.resumes || !req.files?.jd) {
        return res.status(400).json({ error: "Missing files" });
      }

      const jdText = await extractText(
        req.files.jd[0].buffer,
        req.files.jd[0].mimetype,
        req.files.jd[0].originalname
      );

      const results = [];

      for (const file of req.files.resumes.slice(0, 5)) {
        try {
          const resumeText = await extractText(
            file.buffer,
            file.mimetype,
            file.originalname
          );

          const prompt = `
You are an expert recruiter AI.

Return ONLY JSON:
{
  "score": number,
  "matched_skills": [],
  "missing_skills": [],
  "summary": ""
}

JOB:
${jdText}

RESUME:
${resumeText}
`;

          const aiResult = await callGemini(prompt);

          let parsed;

          try {
            parsed = JSON.parse(
              aiResult.replace(/```json/g, "").replace(/```/g, "").trim()
            );
          } catch {
            parsed = {
              score: 20,
              matched_skills: [],
              missing_skills: [],
              summary: "Parse failed",
            };
          }

          results.push({
            name: file.originalname,
            ...parsed,
          });
        } catch (innerErr) {
          results.push({
            name: file.originalname,
            error: true,
          });
        }
      }

      results.sort((a, b) => b.score - a.score);

      res.json({
        success: true,
        results,
      });
    } catch (err) {
      console.error("MULTI ANALYZE ERROR:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);


// ================= START SERVER =================
app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});