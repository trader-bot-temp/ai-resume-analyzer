require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");

const jobRoutes = require("./routes/jobs");
const aiRoutes = require("./routes/ai");

const app = express();

// ================= TRUST PROXY =================
app.set("trust proxy", 1);

// ================= CORS =================
app.use(
  cors({
    origin: true, // allow all origins (safe for debugging)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// ================= BODY =================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ================= MULTER =================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ================= ROUTES =================
app.use("/api/jobs", jobRoutes);
app.use("/api/ai", aiRoutes);

// ================= HEALTH =================
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ================= ANALYZE =================
app.post(
  "/analyze",
  upload.fields([{ name: "resume" }, { name: "jd" }]),
  async (req, res) => {
    try {
      const extractText = require("./pdf");
      const callGemini = require("./services/gemini");

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

      const result = await callGemini(`
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
`);

      let parsed;
      try {
        parsed = JSON.parse(result.replace(/```json|```/g, "").trim());
      } catch {
        parsed = { error: true };
      }

      res.json({ success: true, data: parsed });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ================= MULTI ANALYZE =================
app.post(
  "/analyze-multiple",
  upload.fields([{ name: "resumes" }, { name: "jd" }]),
  async (req, res) => {
    try {
      const extractText = require("./pdf");
      const callGemini = require("./services/gemini");

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
        const resumeText = await extractText(
          file.buffer,
          file.mimetype,
          file.originalname
        );

        const ai = await callGemini(`
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
`);

        let parsed;
        try {
          parsed = JSON.parse(ai.replace(/```json|```/g, "").trim());
        } catch {
          parsed = { score: 0 };
        }

        results.push({ name: file.originalname, ...parsed });
      }

      res.json({ success: true, results });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ================= START =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});