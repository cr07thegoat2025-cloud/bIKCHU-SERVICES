const OWNER_EMAIL = "cr07thegoat2025@gmail.com";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "BIKCHU <onboarding@resend.dev>";
const allowedPackages = new Set(["Basic", "Advanced", "Pro"]);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, package: chosenPackage, idea, website } = req.body || {};
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
    if (!process.env.RESEND_API_KEY) {
      return res.status(503).json({ error: "Email notifications are not configured yet. Please try again later." });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanIdea = idea.trim();
    const textBody = [
      "New BIKCHU project request",
      "",
      "Name: " + cleanName,
      "Client email: " + cleanEmail,
      "Package: " + chosenPackage,
      "",
      "Project idea:",
      cleanIdea,
      "",
      "Reply directly to this email to contact the client."
    ].join("\n");
    const htmlBody = `<h2>New BIKCHU project request</h2>
      <p><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
      <p><strong>Client email:</strong> ${escapeHtml(cleanEmail)}</p>
      <p><strong>Package:</strong> ${escapeHtml(chosenPackage)}</p>
      <h3>Project idea</h3><p style="white-space:pre-wrap">${escapeHtml(cleanIdea)}</p>
      <p>Reply to this email to contact the client.</p>`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [OWNER_EMAIL],
        reply_to: cleanEmail,
        subject: `New BIKCHU request — ${chosenPackage} — ${cleanName}`,
        text: textBody,
        html: htmlBody
      })
    });
    const result = await emailResponse.json().catch(() => ({}));
    if (!emailResponse.ok) {
      console.error("Resend email error:", result);
      return res.status(502).json({ error: "We couldn't email your request. Please try again later." });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Request email failed:", error);
    return res.status(500).json({ error: "We couldn't send your request right now. Please try again later." });
  }
}
