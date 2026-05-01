require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");

// routes
const jobRoutes = require("./routes/jobs");
const aiRoutes = require("./routes/ai");

const app = express();

// ================= TRUST PROXY (important for Railway/Vercel) =================
app.set("trust proxy", 1);

// ================= CORS (PRODUCTION FIX) =================
const allowedOrigins = [
  "https://ai-resume-analyzer-tan-two.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(null, true); // allow all for now (safe for debugging)
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

// handle preflight explicitly
app.options("*", cors());

// ================= BODY PARSER =================
app.use(express.json({ limit: "10mb" }));

// ================= MULTER =================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ================= ROUTES =================
app.use("/api/jobs", jobRoutes);
app.use("/api/ai", aiRoutes);

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.json({
    status: "Backend running 🚀",
    env: process.env.NODE_ENV || "development"
  });
});

// =====================================================
// LEGACY ANALYZE ROUTE
// =====================================================
app.post(
  "/analyze",
  upload.fields([{ name: "resume" }, { name: "jd" }]),
  async (req, res) => {
    try {
      const extractText = require("./pdf");
      const callGemini = require("./gemini");

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
          message: "AI parsing failed"
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
// MULTI RESUME ANALYSIS
// =====================================================
app.post(
  "/analyze-multiple",
  upload.fields([{ name: "resumes" }, { name: "jd" }]),
  async (req, res) => {
    try {
      const extractText = require("./pdf");
      const callGemini = require("./gemini");

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
              summary: "Parse failed"
            };
          }

          results.push({
            name: file.originalname,
            ...parsed
          });
        } catch {
          results.push({
            name: file.originalname,
            error: true
          });
        }
      }

      results.sort((a, b) => b.score - a.score);

      res.json({
        success: true,
        results
      });
    } catch (err) {
      console.error("MULTI ANALYZE ERROR:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});