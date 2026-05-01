const express = require("express");
const router = express.Router();
const supabase = require("../db");

router.post("/", async (req, res, next) => {
  try {
    const candidate = req.body;

    const { data, error } = await supabase
      .from("candidates")
      .insert([
        {
          ...candidate,
          uploaded_at: new Date().toISOString(),
          stage: "applied",
        },
      ])
      .select();

    if (error) throw error;

    res.json({ success: true, candidate: data[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;