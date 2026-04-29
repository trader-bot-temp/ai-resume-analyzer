require("dotenv").config();

async function callGemini(prompt) {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // ✅ FIXED MODEL
          messages: [
            {
              role: "system",
              content:
                "Return ONLY valid JSON. No explanation. No markdown.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
        }),
      }
    );

    const data = await response.json();

    console.log("🧠 GROQ RAW RESPONSE:", JSON.stringify(data));

    if (data.error) {
      throw new Error(data.error.message);
    }

    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("Empty Groq response");
    }

    return text;
  } catch (err) {
    console.error("❌ Groq error:", err.message);

    return JSON.stringify({
      error: true,
      message: err.message,
    });
  }
}

module.exports = callGemini;