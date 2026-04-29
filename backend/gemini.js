require("dotenv").config();

async function callGemini(prompt) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    if (!data.candidates?.[0]) {
      throw new Error("No Gemini response");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    console.error("Gemini error:", err.message);

    return JSON.stringify({
      error: "Gemini failed",
      message: err.message,
    });
  }
}

module.exports = callGemini;