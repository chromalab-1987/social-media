/* ─────────────────────────────────────────────────────────────────
   /api/chat  —  Gemini 3.5 Flash (primario) + Groq Llama (fallback)
   Migrado: modelo 3.5, JSON forzado, filtro de thinking parts,
   fallback a llama-3.1-8b-instant (el 70b da rate limits).
   ───────────────────────────────────────────────────────────────── */

/* Convierte mensajes estilo OpenAI → formato Gemini */
function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

/* ── Provider: Gemini 3.5 Flash ── */
async function callGemini(messages, max_tokens, json) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY no configurada");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: toGeminiContents(messages),
        generationConfig: {
          maxOutputTokens: max_tokens,
          temperature: 0.85,
          ...(json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    const msg = data.error?.message || `Gemini HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  /* Los modelos 3.x con thinking devuelven múltiples parts;
     las de razonamiento traen thought: true y hay que filtrarlas. */
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text = parts
    .filter((p) => !p.thought)
    .map((p) => p.text || "")
    .join("");
  if (!text) throw new Error("Gemini: respuesta vacía");
  return text;
}

/* ── Provider: Groq Llama ── */
async function callGroq(messages, max_tokens) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY no configurada");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      max_tokens,
      messages,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data.error?.message || `Groq HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq: respuesta vacía");
  return text;
}

/* ── Helper: decide si el error justifica el fallback ── */
function shouldFallback(err) {
  // Rate limit, overload, server error, key issues → fallback
  return !err.status || err.status === 429 || err.status >= 500;
}

/* ── Handler principal ── */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { messages, max_tokens = 4000, json = true } = req.body;

  if (!messages?.length) {
    return res.status(400).json({ error: "messages requerido" });
  }

  let geminiError = null;

  /* 1. Intentar Gemini */
  try {
    const text = await callGemini(messages, max_tokens, json);
    return res.status(200).json({ text, provider: "gemini" });
  } catch (err) {
    geminiError = err;
    console.warn(`[chat] Gemini falló (${err.status || "?"}: ${err.message}) — usando Groq`);

    if (!shouldFallback(err)) {
      return res.status(err.status || 500).json({
        error: `Gemini: ${err.message}`,
        provider: "gemini",
      });
    }
  }

  /* 2. Fallback: Groq */
  try {
    const text = await callGroq(messages, max_tokens);
    return res.status(200).json({ text, provider: "groq" });
  } catch (err) {
    console.error(`[chat] Groq también falló: ${err.message}`);
    return res.status(503).json({
      error: `Ambos providers fallaron. Gemini: ${geminiError?.message}. Groq: ${err.message}`,
      provider: "none",
    });
  }
}
