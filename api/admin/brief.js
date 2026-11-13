import { neon } from "@neondatabase/serverless";
import { timingSafeEqual } from "node:crypto";

function getSql() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Missing POSTGRES_URL (or DATABASE_URL) environment variable.");
  return neon(url);
}

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD || "";
  const supplied = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!expected || !supplied) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!authorized(req)) return res.status(401).json({ error: "Incorrect admin password." });
  if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: "Add OPENROUTER_API_KEY in Vercel environment variables first." });

  try {
    const sql = getSql();
    const { id } = req.body || {};
    if (typeof id !== "string" || id.length > 20) return res.status(400).json({ error: "Invalid request reference." });
    const found = await sql`SELECT id, name, package, idea FROM bikchu_requests WHERE id = ${id} LIMIT 1`;
    if (!found.length) return res.status(404).json({ error: "Request not found." });
    const item = found[0];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://bikchu-services.vercel.app",
        "X-Title": "BIKCHU Apps and Services"
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: "You are a practical app-project analyst helping a small app development studio. Analyze the client's request. Return: 1) a concise project summary, 2) suggested MVP features, 3) questions that must be clarified, 4) complexity (Small/Medium/Large) with reasons, 5) a suggested starting quote in USD chosen from $10, $30, or $50 only, with a clear note that the owner must approve or change it. Be realistic: flag features that exceed a small starter package. Do not claim the app has been built. Format with clear headings."
          },
          {
            role: "user",
            content: `Client: ${item.name}\nSelected package: ${item.package}\nApp idea: ${item.idea}`
          }
        ],
        temperature: 0.4,
        max_tokens: 900
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("OpenRouter error:", data);
      return res.status(502).json({ error: "The AI service could not generate a brief. Try again later." });
    }
    const brief = data.choices?.[0]?.message?.content;
    if (!brief) return res.status(502).json({ error: "The AI returned an empty response." });

    await sql`UPDATE bikchu_requests SET brief = ${brief} WHERE id = ${id}`;
    return res.status(200).json({ brief });
  } catch (error) {
    console.error("Brief generation failed:", error);
    return res.status(500).json({ error: "Could not generate the project brief." });
  }
}