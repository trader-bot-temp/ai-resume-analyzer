require("dotenv").config();

async function callGemini(prompt) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    console.log("🧠 GEMINI RAW RESPONSE:", JSON.stringify(data));

    // ❌ HANDLE API ERRORS PROPERLY
    if (data.error) {
      throw new Error(data.error.message || "Gemini API error");
    }

    if (!data.candidates || !data.candidates.length) {
      throw new Error("No candidates returned from Gemini");
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Empty Gemini response text");
    }

    return text;
  } catch (err) {
    console.error("❌ Gemini error:", err.message);

    return JSON.stringify({
      error: true,
      message: err.message,
    });
  }
}

module.exports = callGemini;