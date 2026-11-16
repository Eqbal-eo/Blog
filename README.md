# مدونات آفاق (Afaq Blogs)

An Arabic blogging platform for cultural, intellectual and political writing.
Writers apply to join, admins review applications and posts, and approved posts
are published on the writer's public blog.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions, Cache Components)
- **TypeScript**, **Tailwind CSS v4**, **React 19**
- **Supabase** (PostgreSQL), accessed only from the server with the service-role key
- **Tiptap 3** rich text editor (RTL)
- **Zod** validation, **bcrypt** credential hashing, signed JWT session cookie (`jose`)
- **React Email** templates sent through Brevo SMTP
- **Vercel Analytics** for page views

## Getting started

1. `npm install`
2. Copy `.env.example` to `.env` and fill it in.
3. Run the SQL files in `supabase/migrations/` once, in order, in the Supabase
   SQL Editor (see below).
4. `npm run dev`, then open http://localhost:3000

Other scripts: `npm run build`, `npm start`, `npm run lint`, `npm run typecheck`.

## Database migrations

`supabase/migrations/` holds the SQL that the app relies on beyond the original
tables. Run each file once in **Supabase → SQL Editor**:

| File | What it does |
|---|---|
| `20261116000000_lock_down_public_tables.sql` | Enables row level security on every table with no policies, so the public anon key can read nothing |
| `20261117000000_rate_limits.sql` | Adds the `rate_limits` table and `hit_rate_limit()` function used to throttle login, registration and blog requests |

## Deploying to Vercel

1. Import the repository in Vercel (framework: Next.js, no extra settings).
2. Add every variable from `.env.example` under **Settings → Environment Variables**.
3. Enable **Analytics** in the project to see page views.

## Project layout

```
src/
  app/
    (auth)/         login, register, blog request (+ their Server Actions)
    dashboard/      writer area: overview, posts, editor, notifications, settings
    admin/          post review and blog request review (admins only)
    article/ author/ blogs/ about/ contact/   public pages
  components/       header, footer, dashboard shell, editor, form controls
  lib/              data access, auth/session, email, sanitizing, formatting
  proxy.ts          redirects signed-out visitors away from /dashboard and /admin
supabase/migrations/  SQL to run once in Supabase
```

## Security notes

- All database access happens on the server; the browser never sees a Supabase key.
- Every Server Action re-checks the signed-in user and, for admin actions, the
  role from the database.
- Post HTML is sanitized with an allowlist when saved and again when rendered.
