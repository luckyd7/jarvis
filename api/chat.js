
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is missing in Vercel."
    });
  }

  try {
    const body = req.body || {};
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const history = Array.isArray(body.history)
      ? body.history
          .slice(-8)
          .filter(function (item) {
            return item &&
              ["user", "assistant"].includes(item.role) &&
              typeof item.content === "string";
          })
          .map(function (item) {
            return {
              role: item.role,
              content: item.content.slice(0, 4000)
            };
          })
      : [];

    const input = [
      {
        role: "developer",
        content: "You are JARVIS, a helpful personal AI assistant. Be clear, practical, and concise. Never claim to control the phone or have live data unless a connected feature actually supports it."
      },
      ...history,
      { role: "user", content: message }
    ];

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          input: input,
          max_output_tokens: 700
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "OpenAI request failed with status:",
        response.status
      );

      return res.status(502).json({
        error: "AI provider request failed. Check Vercel logs and API billing."
      });
    }

    const reply =
      typeof data.output_text === "string"
        ? data.output_text.trim()
        : "";

    if (!reply) {
      return res.status(502).json({
        error: "The AI returned no text."
      });
    }

    return res.status(200).json({ reply: reply });

  } catch (error) {
    console.error("JARVIS backend error:", error.message);

    return res.status(500).json({
      error: "Server error while contacting the AI service."
    });
  }
}
