// Vercel serverless function: POST /api/chat
// Keep OPENAI_API_KEY in Vercel Environment Variables, never in browser code.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST for chat requests." });
  }
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Server is missing OPENAI_API_KEY. Add it in Vercel settings, then redeploy." });
  }
  try {
    const body = req.body || {};
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return res.status(400).json({ error: "Please send a message." });
    if (message.length > 4000) return res.status(413).json({ error: "Message is too long (maximum 4,000 characters)." });
    const history = (Array.isArray(body.history) ? body.history.slice(-8) : [])
      .filter(x => x && ["user", "assistant"].includes(x.role) && typeof x.content === "string")
      .map(x => ({ role: x.role, content: x.content.slice(0, 4000) }));
    const input = [
      { role: "developer", content: "You are JARVIS, a helpful personal AI assistant inside an iPhone web app. Be clear, practical, and concise. Help with planning and content creation. Do not claim to have live stock prices, access to the user's phone, or persistent memory unless an enabled integration actually provides it. For financial questions, explain uncertainty and risk; never invent live market data." },
      ...history,
      { role: "user", content: message }
    ];
    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": Bearer ${process.env.OPENAI_API_KEY}, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4.1-mini", input, max_output_tokens: 700 })
    });
    const data = await aiResponse.json().catch(() => ({}));
    if (!aiResponse.ok) {
      console.error("OpenAI API error status:", aiResponse.status);
      if (aiResponse.status === 401) return res.status(502).json({ error: "The AI provider rejected the server key. Check OPENAI_API_KEY in Vercel." });
      if (aiResponse.status === 429) return res.status(503).json({ error: "The AI service is rate-limited or billing is unavailable. Check API usage and billing." });
      return res.status(502).json({ error: "The AI provider returned an error. Check Vercel Function Logs." });
    }
    const reply = typeof data.output_text === "string" ? data.output_text.trim() : "";
    if (!reply) return res.status(502).json({ error: "The AI provider returned no text. Please try again." });
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("JARVIS chat handler failed:", error?.message || "unknown error");
    return res.status(500).json({ error: "Unexpected server error. Please try again." });
  }
}
