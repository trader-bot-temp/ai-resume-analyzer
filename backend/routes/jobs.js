const express = require("express");
const router = express.Router();
const supabase = require("../db");

// CREATE JOB
router.post("/", async (req, res) => {
  try {
    const job = req.body;

    if (!job.title || !job.jd_text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          ...job,
          created_at: new Date().toISOString(),
          status: job.status || "active",
        },
      ])
      .select();

    if (error) throw error;

    res.json({ success: true, job: data?.[0] });
  } catch (err) {
    console.error("JOB CREATE ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// SAVE DRAFT
router.post("/draft", async (req, res) => {
  try {
    const job = req.body;

    const { data, error } = await supabase
      .from("jobs")
      .insert([
        {
          ...job,
          status: "draft",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    res.json({ success: true, job: data?.[0] });
  } catch (err) {
    console.error("DRAFT ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;