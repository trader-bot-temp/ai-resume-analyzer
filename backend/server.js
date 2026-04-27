const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/analyze", (req, res) => {
  console.log("Request received");
  res.json({
    score: 80,
    strengths: ["sample skill"],
    missing_skills: ["sample gap"],
    questions: ["Tell me about your experience"]
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

