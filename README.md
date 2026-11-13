# BIKCHU Apps and Services

A Vercel-hosted app studio website with a Supabase-backed project inbox, private owner dashboard, optional AI-generated project briefs, and Resend email notifications.

## Files

- `index.html` — public website and request form
- `admin.html` — private owner dashboard
- `api/requests.js` — validates and stores client requests, then sends an email notification
- `api/admin/login.js` — creates and clears the owner session
- `api/admin/requests.js` — authenticated request listing and status updates
- `api/admin/brief.js` — optional OpenRouter project brief generation
- `api/_lib/admin.js` — server-side session and Supabase helpers
- `supabase/schema.sql` — database table setup

## Setup (free Supabase plan)

1. A parent/guardian should supervise account setup and client-data handling.
2. Create a Supabase project on the Free plan at https://supabase.com/dashboard.
3. In Supabase → SQL Editor, run the complete contents of `supabase/schema.sql`.
4. In Supabase → Project Settings → API, copy the Project URL and the **service_role** key. Never put the service-role key in browser code or share it publicly.
5. In Vercel → Project → Settings → Environment Variables, add:
   - `SUPABASE_URL` — Supabase Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase service_role key (server-side only)
   - `ADMIN_PASSWORD` — a strong, unique dashboard password; do not put it in GitHub or chat
   - `SESSION_SECRET` — a long random secret used to sign the private admin session
   - `RESEND_API_KEY` — optional email notification API key
   - `RESEND_FROM_EMAIL` — optional; leave unset for Resend's testing sender
   - `OPENROUTER_API_KEY` — optional, enables AI project briefs
   - `OPENROUTER_MODEL` — optional model ID; defaults to `openrouter/auto`
6. Redeploy the Vercel project after adding the variables.
7. Open `/admin.html`, sign in with the dashboard password, and submit a test request from the public website.

## Request handling

- A valid request is saved to Supabase before the form reports success.
- If Resend is configured, BIKCHU emails a notification to `cr07thegoat2025@gmail.com`. Email failure does not discard a request already saved in the database.
- The dashboard lets the owner view requests, change their status, and generate an AI-assisted brief/quote when OpenRouter is configured.
- AI briefs and quotes are drafts for owner review, not guarantees of cost, scope, or delivery.
- The database is not publicly readable: Row Level Security is enabled without public policies, and server-side API routes use the service-role key.

## Free-plan notes

Supabase currently lists a Free plan with 500 MB database storage and two active free projects. Free projects may pause after a week of low activity; check the official pricing and pausing pages for current limits:
- https://supabase.com/pricing
- https://supabase.com/kb/faqs/platform/free-project-pausing

Resend's shared testing sender is limited. To send branded mail or email clients, verify a domain in Resend and configure `RESEND_FROM_EMAIL`.

Starting prices ($10 / $30 / $50) are indicative. Confirm scope, delivery expectations, and final price before accepting paid work. A parent/guardian should supervise client communications, payments, and account administration. Do not collect passwords, payment-card details, or sensitive personal information through the form.
