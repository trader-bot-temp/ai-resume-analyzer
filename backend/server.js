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

const upload = multer({ storage: multer.memoryStorage() });

// ================= HEALTH =================
app.get("/", (req, res) => {
  res.send("Backend running");
});

// ================= ANALYZE =================
app.post(
  "/analyze",
  upload.fields([{ name: "resume" }, { name: "jd" }]),
  async (req, res) => {
    try {
      console.log("🔥 ANALYZE HIT");
      console.log("FILES:", req.files);

      if (!req.files?.resume || !req.files?.jd) {
        return res.status(400).json({ error: "Missing files" });
      }

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

      if (!resumeText || !jdText) {
        return res.status(400).json({
          error: "Could not extract text",
        });
      }

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
      console.error("ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});