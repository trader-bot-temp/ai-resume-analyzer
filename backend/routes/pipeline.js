const express = require("express");
const router = express.Router();
const supabase = require("../db");

router.post("/move", async (req, res, next) => {
  try {
    const { candidate_id, from_stage, to_stage, note } = req.body;

    await supabase.from("stage_transitions").insert([
      {
        candidate_id,
        from_stage,
        to_stage,
        note,
        moved_at: new Date().toISOString(),
      },
    ]);

    await supabase
      .from("candidates")
      .update({ stage: to_stage })
      .eq("id", candidate_id);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;