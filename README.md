# BIKCHU Apps and Services

A Vercel-hosted app studio website. Project requests are emailed to the owner through Resend; no database is required.

## Files

- `index.html` — public landing page and project request form
- `admin.html` — owner information page
- `api/requests.js` — validates submissions and emails them through Resend
- `vercel.json` — Vercel serverless function configuration

## Configure email

1. Create a Resend account at https://resend.com using the owner's inbox: `cr07thegoat2025@gmail.com`.
2. Create an API key with permission to send emails.
3. In Vercel → Project → Settings → Environment Variables, add:
   - `RESEND_API_KEY` — the secret API key from Resend.
   - Optional: `RESEND_FROM_EMAIL` — leave unset initially to use `BIKCHU <onboarding@resend.dev>`.
4. Redeploy the Vercel project.
5. Submit a test request and check the owner's inbox and spam folder.

**Important testing limitation:** Resend's shared `onboarding@resend.dev` sender is for testing and can only send to the email address registered with your Resend account. Sign up to Resend with `cr07thegoat2025@gmail.com` to test delivery to this inbox. To send using a custom branded sender or to other recipients, verify a domain in Resend and set `RESEND_FROM_EMAIL` to an address on that verified domain.

## How requests work

- The form validates the client's name, email, selected package, and app idea.
- The Vercel serverless function sends a notification email to `cr07thegoat2025@gmail.com`.
- The client's email is set as Reply-To, so the owner can reply directly.
- Requests are **not stored in a database**. Keep the notification emails as the record.
- If email setup is missing or sending fails, the form displays an error rather than pretending the request was received.

Starting prices ($10 / $30 / $50) are indicative. Confirm project scope, delivery expectations, and final price before accepting paid work. Have a parent/guardian supervise client communications, payments, and account administration. Do not collect passwords, payment-card data, or sensitive personal information through the form.
