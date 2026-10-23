
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Use POST." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing in Vercel."
    });
  }

  try {
    const body = req.body || {};
    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return res.status(400).json({
        error: "Message is required."
      });
    }

    const history = Array.isArray(body.history)
      ? body.history
          .slice(-8)
          .filter(function (item) {
            return item &&
              ["user", "assistant", "model"].includes(item.role) &&
              typeof item.content === "string";
          })
          .map(function (item) {
            return {
              role: item.role === "assistant" ? "model" : item.role,
              parts: [{ text: item.content.slice(0, 4000) }]
            };
          })
      : [];

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are JARVIS, a helpful personal AI assistant. Be practical, clear, and concise. Never claim to control the phone or access live data unless a connected feature supports it."
            }]
          },
          contents: [
            ...history,
            {
              role: "user",
              parts: [{ text: message }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 700
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        response.status,
        data.error?.status || "unknown",
        data.error?.message || "No details"
      );

      return res.status(502).json({
        error: "Gemini request failed. Check Vercel logs for details."
      });
    }

    const reply = (
      data.candidates?.[0]?.content?.parts || []
    )
      .map(function (part) {
        return part.text || "";
      })
      .join("")
      .trim();

    if (!reply) {
      console.error(
        "Gemini returned no text. Finish reason:",
        data.candidates?.[0]?.finishReason || "unknown"
      );

      return res.status(502).json({
        error: "Gemini returned no text. Check Vercel logs."
      });
    }

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("JARVIS backend error:", error.message);

    return res.status(500).json({
      error: "Server error while contacting Gemini."
    });
  }
}
