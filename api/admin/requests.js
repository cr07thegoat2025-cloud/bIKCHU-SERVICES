import { sql } from "@vercel/postgres";
import { timingSafeEqual } from "node:crypto";

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
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!authorized(req)) return res.status(401).json({ error: "Incorrect admin password." });

  try {
    const result = await sql`
      SELECT id, name, email, package, idea, status, brief, created_at
      FROM bikchu_requests
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return res.status(200).json({ requests: result.rows });
  } catch (error) {
    console.error("Admin list failed:", error);
    return res.status(500).json({ error: "Could not load requests. Check that the database is connected." });
  }
}