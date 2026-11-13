# BIKCHU Apps and Services

A small Vercel-hosted app studio website with a project request form, private owner dashboard, Postgres storage, and an owner-triggered OpenRouter project brief generator.

## Files

- `index.html` — public landing page, starting-price cards, and project request form
- `admin.html` — private owner dashboard (visit `/admin.html`)
- `api/requests.js` — validates and stores client requests
- `api/admin/requests.js` — password-protected request list
- `api/admin/brief.js` — owner-triggered AI brief generator

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Keep the project root at the repository root.
3. Install a Postgres database integration from the Vercel Marketplace (Neon is a straightforward choice) and connect it to this project. The code reads `POSTGRES_URL`, or `DATABASE_URL` as a fallback.
4. In Vercel → Project → Settings → Environment Variables, add:
   - `ADMIN_PASSWORD` — a long, unique password for the owner dashboard.
   - `OPENROUTER_API_KEY` — your OpenRouter API key. Keep it only in Vercel environment variables; never paste it into this repository or public frontend.
5. Redeploy after the database and environment variables are connected.
6. Open the deployed site. Test a request, then open `/admin.html` and sign in with the admin password.

The app uses the supported Neon serverless Postgres driver rather than the retired `@vercel/postgres` package. Make sure your database integration provides either `POSTGRES_URL` or `DATABASE_URL`.

## Important first-release notes

- The public form stores requests; it does not automatically email clients.
- AI brief generation is manually triggered by the owner. It produces a draft, not a finished app, tested code, or an automatically approved quote.
- Starting prices ($10 / $30 / $50) are indicative. Confirm scope, delivery expectations, and final price with the client before accepting paid work.
- The dashboard uses a shared admin password and does not yet have user accounts, session cookies, rate limiting, or a full audit log. Before advertising this publicly or storing real client data, add stronger authentication, abuse protection, backups, and a clear privacy notice. Have a parent/guardian supervise client communications, payments, and account administration.
- Do not collect passwords, payment-card data, or sensitive personal information through the project form.

## Local development

Install Node.js, then run:

```bash
npm install
npx vercel dev
```

Set the environment variables and connect a Postgres database before testing API routes.
