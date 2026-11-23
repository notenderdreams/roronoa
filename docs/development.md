# Roronoa: Development Guide

Campus lost & found system. Finders submit found items, admins confirm physical handover, owners submit lost reports, admins match and verify.

> Status: scaffold only. Sections marked **(planned)** are decided but not built yet.

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
cp .env.example .env     # then set AUTH_SECRET (bunx auth secret, or any long random string)
bun install
bun run db:up            # starts Postgres + MinIO in Docker
bun run db:migrate       # applies Prisma migrations (planned: needs schema first)
bun run db:seed          # creates the admin account (planned)
bun run dev              # http://localhost:3000
```

If `prisma generate` doesn't run on install, run `bun pm untrusted`, then `bun pm trust prisma @prisma/client`.

### Scripts

| Script | Does |
|---|---|
| `bun run dev` | dev server |
| `bun run build` / `start` | production build / serve |
| `bun run lint` | ESLint |
| `bun run db:up` | `docker compose up -d` |
| `bun run db:migrate` | `prisma migrate dev` |
| `bun run db:seed` | runs `prisma/seed.ts` directly with Bun |
| `bun run db:studio` | Prisma Studio (DB browser) |

## 4. Local services (Docker)

Defined in `docker-compose.yml`:

| Service | Image | Ports | Notes |
|---|---|---|---|
| `db` | `postgres:16-alpine` | 5432 | user/pass/db all `roronoa` |
| `s3` | `minio/minio` | 9000 (API), 9001 (console) | S3-compatible stand-in for Cloudflare R2. Bucket `roronoa` is created on startup. |

- Stop: `docker compose down`. Wipe data too: `docker compose down -v`.
- Alpine Postgres cannot load `pgvector`. If vector search is added later, switch to `pgvector/pgvector:pg16`.
- MinIO has no Alpine variant. If its image gives trouble, Garage or LocalStack are drop-in S3 alternatives; the app doesn't change.

### Environment variables

See `.env.example`.

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection |
| `AUTH_SECRET` | Auth.js session signing |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` | object storage |
| `S3_FORCE_PATH_STYLE` | `true` for MinIO, `false` for R2/S3 |

Local and production differ **only by these values**. No code changes between environments.

## 5. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Runtime / tooling | Bun |
| Styling / UI | Tailwind CSS 4, shadcn/ui **(planned)** |
| Forms | react-hook-form + Zod resolver |
| Validation | Zod (shared schemas in `src/lib/schemas.ts`) |
| ORM / DB | Prisma 7 + PostgreSQL |
| Auth | Auth.js (`next-auth@beta`), `bcryptjs` for passwords |
| File storage | S3 API via `@aws-sdk/client-s3` + presigner. MinIO locally, Cloudflare R2 in production |
| Hosting | Vercel (app), Neon or Supabase (Postgres), Cloudflare R2 (images) |
| CI | GitHub Actions **(planned)** |

## 6. Project structure

```
roronoa/
├── docs/                       # documentation (this file)
├── prisma/
│   ├── schema.prisma           # (planned)
│   ├── migrations/
│   └── seed.ts                 # (planned) admin account + sample data
├── public/
├── src/
│   ├── app/                    # routes (App Router)
│   │   ├── (auth)/             # login, register
│   │   ├── (user)/             # any logged-in user: found/, lost/, my-reports/
│   │   ├── admin/              # admin only: handovers/, inventory/, lost-reports/
│   │   └── api/
│   │       ├── auth/[...nextauth]/   # Auth.js
│   │       └── uploads/presign/      # presigned S3 upload URL
│   ├── actions/                # server actions = all mutations
│   ├── queries/                # read helpers used by server components
│   ├── components/             # ui/ (shadcn) + feature components
│   ├── lib/                    # db, auth, guards, storage, report-id, audit, schemas
│   └── middleware.ts           # (planned) redirect unauthenticated / non-admin
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

Route handlers are limited to: Auth.js, and the upload presign endpoint.

### Server action order (follow every time)

1. `requireUser()` or `requireAdmin()`. **Re-check even if the UI hides the button**: a server action is a public HTTP endpoint.
2. Parse input with the Zod schema.
3. Write to the DB **and** the audit event inside one `db.$transaction`.
4. `revalidatePath(...)` for any page whose data changed.
5. Return a small result (e.g. the report ID), not whole DB rows.

## 8. Domain model

Roles: `USER`, `ADMIN`, later `AUTHORITY`.

| Model | Key fields |
|---|---|
| `User` | email, passwordHash, role |
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

- Credentials login (campus email + password), bcrypt hashed. Role is stored on the user and exposed on the session.
- Three layers: `middleware.ts` redirects, the `admin/layout.tsx` guard, and `requireAdmin()` inside every admin action and admin query. The last one is the one that counts.

## 11. Audit trail

Every important mutation writes an `AuditEvent` (who, what, which entity, when) in the same transaction as the change. Required for: report submission, handover confirmation, ownership verification, item collection, investigation outcomes.

## 12. Key decisions

| Decision | Why |
|---|---|
| One Next.js app, no monorepo | Sprint 1 is CRUD + roles + uploads. Fastest path to a demo. |
| Server actions instead of tRPC/REST | Already end-to-end typed inside one app. tRPC adds setup for no gain. |
| Prisma over Drizzle | Readable schema, built-in migrations, Studio, best docs. Vector queries would need raw SQL, acceptable. |
| Postgres only | One DB covers relational data, fuzzy text (`pg_trgm`) and later vectors. |
| S3 API for storage | Same code for MinIO (local) and R2 (prod). Avoids vendor SDK lock-in. |
| Bun only | One toolchain for install, run and scripts. |
| Alpine images | Smaller local footprint. |
| Admin-only found feed | Found items are shown only after physical handover, and only to admins, so the system never claims custody it doesn't have. |

## 13. Roadmap

| Sprint | Stories |
|---|---|
| 1 | US-01 submit found report, US-02 confirm handover, US-03 submit lost report (with auth, roles, uploads, audit) |
| Later | matching + scoring (US-06/07), contact and verification (US-08/09/10), notifications (US-23), CCTV detection and investigation (Epics 3-4) |

CCTV analysis (object detection and tracking) is the one part likely to need a separate Python process. Everything else stays in this app. Matching starts in `src/lib/matching/` using Postgres text similarity and scoring weights, and returns reasons per component so admins can see why something matched.

## 14. Deploying (planned)

1. Create a Neon or Supabase Postgres, a Cloudflare R2 bucket (private) with a CORS rule allowing `PUT` from the app domain, and an R2 API token.
2. Import the repo into Vercel and set the env vars from section 4 with production values (`S3_FORCE_PATH_STYLE=false`, `S3_REGION=auto`).
3. Run `bunx prisma migrate deploy` against the production DB.
4. Do one real upload against R2 before demo day to check CORS and signing.
