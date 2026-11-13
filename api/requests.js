import { sql } from "@vercel/postgres";
import { randomUUID } from "node:crypto";

const allowedPackages = new Set(["Basic", "Advanced", "Pro"]);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS bikchu_requests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      package TEXT NOT NULL,
      idea TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'New',
      brief TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, package: chosenPackage, idea, website } = req.body || {};
    // Honeypot field: real visitors leave this empty.
    if (website) return res.status(200).json({ ok: true });
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
      return res.status(400).json({ error: "Please enter a name between 2 and 80 characters." });
    }
    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (!allowedPackages.has(chosenPackage)) {
      return res.status(400).json({ error: "Please choose one of the listed packages." });
    }
    if (typeof idea !== "string" || idea.trim().length < 15 || idea.trim().length > 5000) {
      return res.status(400).json({ error: "Tell us a little more about your app (15–5,000 characters)." });
    }

    await ensureTable();
    const id = randomUUID().slice(0, 8).toUpperCase();
    await sql`
      INSERT INTO bikchu_requests (id, name, email, package, idea)
      VALUES (${id}, ${name.trim()}, ${email.trim().toLowerCase()}, ${chosenPackage}, ${idea.trim()})
    `;
    return res.status(201).json({ ok: true, reference: id });
  } catch (error) {
    console.error("Request submission failed:", error);
    return res.status(500).json({ error: "We couldn't save your request right now. Please try again later." });
  }
}