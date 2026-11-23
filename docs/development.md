# Roronoa: Development Guide

Campus lost & found system. Finders submit found items, admins confirm physical handover, owners submit lost reports, admins match and verify.

> Status: auth is built (register with campus email, verify, login, roles). Found/lost reports, handover and the rest are **(planned)**.

## 1. Rules

- **Bun only.** Never run `npm`, `npx`, `yarn` or `pnpm`. Use `bun install`, `bun add`, `bun run`, `bunx`. Only `bun.lock` is committed.
- **Run Next through Bun:** scripts use `bun --bun next ...`, so don't call `next` directly.
- **Never commit `.env`.** Only `.env.example`.
- **Validate every input with Zod** on the server, even if the form already validated it.

## 2. Prerequisites

| Tool | Why |
|---|---|
| Bun >= 1.4 | package manager, runtime, script runner |
| Docker Desktop | local Postgres + S3-compatible storage |
| Git | version control |

## 3. First-time setup

```bash
cp .env.example .env     # then set BETTER_AUTH_SECRET (e.g. openssl rand -base64 32)
bun install
bun run db:up            # starts Postgres + S3 storage in Docker
bun --bun prisma generate   # generates the client into src/generated (gitignored)
bun --bun prisma migrate deploy   # applies committed migrations
bun run db:seed          # creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD
bun run s3:init          # creates the storage bucket
bun run dev              # http://localhost:3000
```

Emails go through `src/lib/mail.ts` using the Brevo API. Set `BREVO_API_KEY` and `MAIL_FROM` (`Name <email>`, must be a sender verified in Brevo). With `BREVO_API_KEY` empty, emails print to the dev server console.

**Brevo setup (real emails)**
1. Create a Brevo account. Under Senders, add and verify a sender address (a single email is enough, no domain needed).
2. Create an API key (SMTP & API → API Keys).
3. Under Security → Authorised IPs, click **Deactivate blocking**. Otherwise Brevo rejects calls from any IP you haven't allow-listed (home IPs change, and so do Vercel's).
4. In `.env`: `BREVO_API_KEY="xkeysib-..."` and `MAIL_FROM="Roronoa <your-verified-sender>"`. `MAIL_FROM` must match the verified sender exactly.
5. Never commit the key. It lives in `.env` locally and in Vercel env vars when deployed. Rotate it in Brevo if it leaks.

After changing `prisma/schema.prisma`: `bun run db:migrate` (creates + applies a migration), then commit the new folder under `prisma/migrations/`.

### Scripts

| Script | Does |
|---|---|
| `bun run dev` | dev server |
| `bun run build` / `start` | production build / serve |
| `bun run lint` | ESLint |
| `bun run db:up` | `docker compose up -d` |
| `bun run s3:init` | creates the bucket from `S3_BUCKET` (safe to re-run) |
| `bun run db:migrate` | `prisma migrate dev` |
| `bun run db:seed` | runs `prisma/seed.ts` directly with Bun |
| `bun run db:studio` | Prisma Studio (DB browser) |

## 4. Local services (Docker)

Defined in `docker-compose.yml`:

| Service | Image | Ports | Notes |
|---|---|---|---|
| `db` | `postgres:16-alpine` | 5432 | user/pass/db all `roronoa` |
| `s3` | `rustfs/rustfs` | 9000 (API), 9001 (console) | S3-compatible stand-in for Cloudflare R2. Create the bucket with `bun run s3:init`. |

- Stop: `docker compose down`. Wipe data too: `docker compose down -v`.
- Alpine Postgres cannot load `pgvector`. If vector search is added later, switch to `pgvector/pgvector:pg16`.
- `minio/minio` is no longer published on Docker Hub, so we use RustFS (~430 MB, not small). Garage or SeaweedFS are lighter S3-compatible options; the app doesn't change, only the compose service and bucket setup.

### Environment variables

See `.env.example`.

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection |
| `BETTER_AUTH_SECRET` | signs sessions/tokens |
| `BETTER_AUTH_URL` | app base URL (must match the port you browse on) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | used only by `prisma/seed.ts` |
| `BREVO_API_KEY` | send email via Brevo; empty = print to console |
| `MAIL_FROM` | `Name <email>`; must be a verified Brevo sender |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | object storage |
| `S3_FORCE_PATH_STYLE` | `true` for local S3, `false` for R2/S3 |

Local and production differ **only by these values**. No code changes between environments.

## 5. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Runtime / tooling | Bun |
| Styling / UI | Tailwind CSS 4, shadcn/ui **(planned)** |
| Forms | react-hook-form + Zod resolver |
| Validation | Zod (shared schemas in `src/lib/schemas.ts`) |
| ORM / DB | Prisma 7 + PostgreSQL via `@prisma/adapter-pg`. Client is generated into `src/generated/prisma` (gitignored; run `prisma generate`). |
| Auth | Better Auth (email + password, admin plugin, Prisma adapter) |
| File storage | S3 API via `@aws-sdk/client-s3` + presigner. RustFS locally, Cloudflare R2 in production |
| Hosting | Vercel (app), Neon or Supabase (Postgres), Cloudflare R2 (images) |
| CI | GitHub Actions **(planned)** |

## 6. Project structure

```
roronoa/
├── docs/                       # documentation (this file)
├── prisma/
│   ├── schema.prisma           # Better Auth tables (user, session, account, verification)
│   ├── migrations/
│   └── seed.ts                 # admin account
├── public/
├── src/
│   ├── app/                    # routes (App Router)
│   │   ├── (auth)/             # login, register
│   │   ├── (user)/             # any logged-in user: found/, lost/, my-reports/
│   │   ├── admin/              # admin only: handovers/, inventory/, lost-reports/
│   │   ├── verify-email/       # "check your inbox" page
│   │   └── api/
│   │       ├── auth/[...all]/        # Better Auth handler
│   │       └── uploads/presign/      # presigned S3 upload URL
│   ├── actions/                # server actions = all mutations
│   ├── queries/                # read helpers used by server components
│   ├── components/             # ui/ (shadcn) + feature components
│   ├── lib/                    # db, auth, guards, storage, report-id, audit, schemas
│   └── proxy.ts                # redirects users without a session cookie (Next 16 name for middleware)
├── prisma.config.ts            # Prisma 7 config (datasource URL, seed command)
├── scripts/s3-init.ts          # creates the bucket
├── docker-compose.yml
├── .env.example
└── package.json
```

### What goes where

| Folder | Rule |
|---|---|
| `src/app` | Pages and layouts only. Keep logic out. |
| `src/actions` | One file per domain (`found.ts`, `lost.ts`, `handover.ts`). Every export is a server action (`"use server"`). |
| `src/queries` | Read-only DB functions. Called from server components. |
| `src/lib` | Shared helpers. No React. |
| `src/components` | Client/UI components. They call actions, never Prisma. |

## 7. How the frontend talks to the backend

Single Next.js app, no separate API server and no tRPC.

| Need | Use |
|---|---|
| Page needs data | **Server component** queries Prisma directly (`src/queries`) |
| User changes data (submit, confirm) | **Server action** called from a form or button |
| Browser needs a URL mid-interaction, or an external system calls in | **Route handler** under `src/app/api` |

Route handlers are limited to: Better Auth, and the upload presign endpoint **(planned)**.

### Server action order (follow every time)

1. `requireUser()` or `requireAdmin()`. **Re-check even if the UI hides the button**: a server action is a public HTTP endpoint.
2. Parse input with the Zod schema.
3. Write to the DB **and** the audit event inside one `db.$transaction`.
4. `revalidatePath(...)` for any page whose data changed.
5. Return a small result (e.g. the report ID), not whole DB rows.

## 8. Domain model

Roles (string on `User.role`): `user` (default), `admin`, later `authority`.

| Model | Key fields |
|---|---|
| `User` | name, email, studentId (unique), emailVerified, role. Passwords live on `Account`. (built) |
| `FoundReport` | reportId, name, category, description, location, foundAt, imageKey, status, finderId, handedOverAt, confirmedById |
| `LostReport` | reportId, name, category, description, location, lostAt, imageKey, status, ownerId |
| `AuditEvent` | actorId, action, entityId, createdAt |

`FoundReport.status`: `PENDING_HANDOVER` -> `IN_CUSTODY` -> (later) `RETURNED`.

Rules:
- Only `IN_CUSTODY` items appear in the admin found-item feed, and later in matching.
- Handover sets `status`, `handedOverAt` and `confirmedById` in one update.
- Report IDs look like `LF-2026-000123`, generated from a Postgres sequence. The primary key stays a UUID.
- Images are stored as an object key string on the report, not a separate table (for now).

## 9. File uploads

1. Browser calls `POST /api/uploads/presign` (login required, content type allow-listed to jpeg/png/webp).
2. Server returns a 60-second signed `PUT` URL and an object key.
3. Browser uploads **directly** to the bucket.
4. The key is submitted with the form and saved on the report.

**Privacy:** photos may show ID cards or phones. Buckets are private. Never use public URLs. Show images through short-lived signed `GET` URLs created on the server, only for the finder and admins.

## 10. Auth and access control

Better Auth, configured in `src/lib/auth.ts`.

**Sign-up** takes name, student ID, university email, password.
- Email must end in exactly `@iut-dhaka.edu` (`isCampusEmail` in `src/lib/schemas.ts`: lowercase, split at the last `@`, exact domain compare, so `x@iut-dhaka.edu.evil.com` fails).
- Enforced twice: Zod on the form (UX) and a Better Auth `databaseHooks.user.create.before` hook (the real check; also validates the student ID).
- Student ID is unique. The format regex is a placeholder (`^\d{6,12}$`); tighten it once the real IUT format is known.
- A domain check alone proves nothing, so login is blocked until the email is verified (`requireEmailVerification`). Unverified logins return 403 and re-send the link.
- `role` cannot be sent from sign-up (rejected with `FIELD_NOT_ALLOWED`). Everyone starts as `user`.

**Admins** are created by `bun run db:seed`, written straight to the DB (bypasses the domain hook). Change the password after first login.

**How email verification works**

Proves the person owns the `@iut-dhaka.edu` inbox. A domain check alone proves nothing, since anyone can type any address.

1. User submits the register form. The server creates the user with `emailVerified = false` and **no session**.
2. Better Auth calls `sendVerificationEmail` (`src/lib/auth.ts`), which calls `sendMail` (`src/lib/mail.ts`). That POSTs to Brevo's API and Brevo delivers a link like `{BETTER_AUTH_URL}/api/auth/verify-email?token=...`. The token is a signed, time-limited token (valid 1 hour).
3. The browser lands on `/verify-email` ("Check your inbox").
4. User clicks the link, so `GET /api/auth/verify-email` runs. If the token is valid and unexpired, the server sets `emailVerified = true` and (`autoSignInAfterVerification`) creates a session cookie, then redirects to the app.
5. From then on, `/login` works normally.

Login before verifying:
- Correct password, unverified: **403** `EMAIL_NOT_VERIFIED`. Because of `sendOnSignIn`, a fresh link is emailed automatically and the login form sends the user to `/verify-email`. This is also the "resend" path.
- Wrong password: **401** `INVALID_EMAIL_OR_PASSWORD`. No email is sent.

Behavior to know:
- A link only works on the device that can reach `BETTER_AUTH_URL`. In dev that is `localhost:3000`, so opening it on a phone fails. This goes away once deployed.
- Each new email has its own token. Older links expire after 1 hour regardless.
- Delivery depends on Brevo and the recipient's spam filter, so a message can be accepted by Brevo and still land in spam.
- Seeded admins are created pre-verified, so they skip this flow.
- With `BREVO_API_KEY` empty, the link is printed in the dev server console instead of emailed (handy for tests without a key).

Debugging: send failures are logged as `mail failed: Brevo <status>: ...` in the dev server console.
- `401 unrecognised IP address`: Brevo IP blocking is on. Deactivate it.
- `400` about the sender: `MAIL_FROM` isn't a verified Brevo sender.
- `401` otherwise: wrong API key.

Possible later change: replace the link with a 6-digit code (Better Auth `emailOTP` plugin). It avoids links opening in the wrong browser or device, but it needs a code-entry page and attempt limits. Not needed for Sprint 1.

**Protection layers**
1. `src/proxy.ts`: redirects requests with no session cookie to `/login` for `/found`, `/lost`, `/my-reports`, `/admin`. Cookie presence only, so it is not a security check.
2. `requireUser()` / `requireAdmin()` in `src/lib/guards.ts`: validate the session server-side and redirect. Call one at the top of every protected page and **every server action and query**. This is the layer that counts.

Reading the session (`getSession()`) uses `headers()`, so with Cache Components enabled any component that calls it must sit inside `<Suspense>` (see `src/app/page.tsx`) or the build fails.

## 11. Audit trail

Every important mutation writes an `AuditEvent` (who, what, which entity, when) in the same transaction as the change. Required for: report submission, handover confirmation, ownership verification, item collection, investigation outcomes.

## 12. Key decisions

| Decision | Why |
|---|---|
| One Next.js app, no monorepo | Sprint 1 is CRUD + roles + uploads. Fastest path to a demo. |
| Server actions instead of tRPC/REST | Already end-to-end typed inside one app. tRPC adds setup for no gain. |
| Better Auth over Auth.js | Auth.js is stuck in beta and its maintainers moved to Better Auth. Built-in email+password, verification and an admin/roles plugin. |
| Prisma over Drizzle | Readable schema, built-in migrations, Studio, best docs. Vector queries would need raw SQL, acceptable. |
| Postgres only | One DB covers relational data, fuzzy text (`pg_trgm`) and later vectors. |
| S3 API for storage | Same code for RustFS (local) and R2 (prod). Avoids vendor SDK lock-in. |
| Bun only | One toolchain for install, run and scripts. |
| Alpine images | Smaller local footprint. |
| Admin-only found feed | Found items are shown only after physical handover, and only to admins, so the system never claims custody it doesn't have. |

## 13. Roadmap

| Sprint | Stories |
|---|---|
| 1 | US-01 submit found report, US-02 confirm handover, US-03 submit lost report (with auth, roles, uploads, audit) |
| Later | matching + scoring (US-06/07), contact and verification (US-08/09/10), notifications (US-23), CCTV detection and investigation (Epics 3-4) |

CCTV analysis (object detection and tracking) is the one part likely to need a separate Python process. Everything else stays in this app. Matching starts in `src/lib/matching/` using Postgres text similarity and scoring weights, and returns reasons per component so admins can see why something matched.

## 13b. Gotchas

- Next runs on the Bun runtime (`bun --bun next`). Turbopack renames externals with hashes that Bun can't resolve, so `next.config.ts` bundles `@prisma/client`, `@prisma/adapter-pg` and `pg` via `transpilePackages`. Don't remove it.
- Prisma 7 does not read `.env` itself; `prisma.config.ts` imports `dotenv/config`.
- Only one `next dev` per project directory. A second one exits with "Another next dev server is already running".
- Verification links are built from `BETTER_AUTH_URL`; set it to the real public URL when deploying or links will point at `localhost`.
- `BETTER_AUTH_URL` must match the origin you browse on, or requests fail the origin check.

## 14. Deploying (planned)

1. Create a Neon or Supabase Postgres, a Cloudflare R2 bucket (private) with a CORS rule allowing `PUT` from the app domain, and an R2 API token.
2. Import the repo into Vercel and set the env vars from section 4 with production values (`S3_FORCE_PATH_STYLE=false`, `S3_REGION=auto`).
3. Run `bunx prisma migrate deploy` against the production DB.
4. Do one real upload against R2 before demo day to check CORS and signing.
