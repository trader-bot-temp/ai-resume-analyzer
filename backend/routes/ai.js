const express = require("express");
const router = express.Router();
const gemini = require("../services/gemini");

router.post("/enhance-jd", async (req, res, next) => {
  try {
    const { jd_text } = req.body;

    const enhanced = await gemini.enhanceJD(jd_text);

    res.json({ success: true, enhanced });
  } catch (err) {
    next(err);
  }
});

module.exports = router;