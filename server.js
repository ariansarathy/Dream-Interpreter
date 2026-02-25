import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/api/interpret", async (req, res) => {
  const { dream } = req.body;

  const prompt = `
You are a compassionate dream interpreter.
Respond ONLY with JSON.

Dream: "${dream}"
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

  const data = await response.json();
  const text = data.content[0].text;
  res.json(JSON.parse(text));
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
