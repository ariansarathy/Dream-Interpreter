import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("."));

app.post("/api/interpret", async (req, res) => {
  try {
    const { dream } = req.body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "Anthropic API key is not configured on the server." });
    }

    const prompt = `
You are a compassionate dream interpreter.
Analyze the following dream and provide a thoughtful, psychological interpretation.

Dream: "${dream}"

Respond ONLY with a JSON object in the following format:
{
  "mainThemes": ["theme1", "theme2"],
  "emotionalTone": "A description of the emotional atmosphere",
  "symbols": [
    { "symbol": "symbol name", "meaning": "what it represents" }
  ],
  "personalInsight": "A personalized reflection",
  "guidance": "Gentle guidance for self-reflection"
}
`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Anthropic API Error:", response.status, errorData);
      throw new Error(errorData.error?.message || `Anthropic API error (${response.status})`);
    }

    const data = await response.json();
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error("Unexpected Anthropic API response structure:", data);
      throw new Error("Invalid response structure from Anthropic API");
    }

    const text = data.content[0].text;

    // Robust JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to extract JSON from AI response:", text);
      throw new Error("Could not parse interpretation from AI response");
    }

    try {
      res.json(JSON.parse(jsonMatch[0]));
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Extracted text:", jsonMatch[0]);
      throw new Error("Interpretation result was not valid JSON");
    }
  } catch (error) {
    console.error("Interpretation route error:", error);
    res.status(500).json({ error: error.message || "An unexpected error occurred" });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
