const express = require("express");
const router = express.Router();
const callGemini = require("../services/gemini");

router.post("/enhance-jd", async (req, res) => {
  try {
    const jd_text = req.body?.jd_text;

    if (!jd_text) {
      return res.status(400).json({ error: "jd_text required" });
    }

    const prompt = `
Improve this job description:

${jd_text}

Return ONLY JSON:
{ "enhanced_jd": "" }
`;

    const result = await callGemini(prompt);

    return res.json({
      success: true,
      enhanced: result,
    });

  } catch (err) {
    console.error("AI ERROR:", err);
    return res.status(500).json({ error: "AI route failed" });
  }
});

module.exports = router;