const express = require("express");
const router = express.Router();
const callGemini = require("../services/gemini");

router.post("/enhance-jd", async (req, res) => {
  try {
    const { jd_text } = req.body;

    if (!jd_text) {
      return res.status(400).json({ error: "jd_text is required" });
    }

    const prompt = `
Improve this job description and make it more professional, clear, and structured:

${jd_text}

Return ONLY JSON:
{
  "enhanced_jd": ""
}
`;

    const result = await callGemini(prompt);

    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = {
        enhanced_jd: result,
      };
    }

    res.json({
      success: true,
      enhanced: parsed,
    });
  } catch (err) {
    console.error("AI ROUTE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;