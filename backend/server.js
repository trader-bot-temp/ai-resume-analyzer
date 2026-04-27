const express = require("express");
const cors = require("cors");
const multer = require("multer");
const extractText = require("./pdf");
const callGemini = require("./gemini");

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.post(
  "/analyze",
  upload.fields([
    { name: "resume" },
    { name: "jd" },
  ]),
  async (req, res) => {
    try {
      const resumeFile = req.files.resume[0];
      const jdFile = req.files.jd[0];

      const resumeText = await extractText(resumeFile.buffer);
      const jdText = await extractText(jdFile.buffer);

      const prompt = `
You are an expert recruiter.

Compare Resume and Job Description.

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
        result,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  }
);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
