export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { messages, max_tokens = 4000 } = req.body;

  // Convert OpenAI-style messages to Gemini format
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: max_tokens },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json({ error: data.error?.message || "Error de API" });
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  res.status(200).json({ text });
}
