# US-02: Confirm Physical Handover — Feature Documentation

This document describes the implementation of **User Story 02: Confirm Physical Handover** for the Roronoa campus lost & found system. It details the acceptance criteria, the scope boundary, every file created or modified, and testing instructions.

---

## 1. User Story & Acceptance Criteria

**User Story:**
> *As an admin, I want to confirm the physical receipt of a reported item so that the system only considers items that are actually in administrative custody.*

### Acceptance Criteria Mapping

| Acceptance Criterion | How It Is Satisfied | Implementation Location |
|---|---|---|
| **AC-1: The admin can view pending handover requests** | Protected admin dashboard at `/admin/handovers` displaying all reported items with `status: PENDING_HANDOVER`. Displays item photograph (via short-lived private S3 signed URL), item name, category, description, location found, found date, and finder details (name, email, student ID). Includes live search and category filter pills. | `src/app/admin/handovers/page.tsx`<br>`src/queries/handover.ts` |
| **AC-2: The admin can confirm receipt of an item** | Admins can confirm receipt via two methods:<br>1. Card-level **"Confirm Receipt"** button with confirmation prompt.<br>2. **"Quick Confirm by Report ID"** input (e.g. `LF-2026-000001`) with toast notification feedback. | `src/components/HandoverActions.tsx`<br>`src/actions/handover.ts` |
| **AC-3: The system records the handover date and time** | Updates the item's `handedOverAt` timestamp to the exact time of confirmation and sets `confirmedById` to the confirming admin's ID. In the **same atomic database transaction**, an immutable `AuditEvent` (`action: "HANDOVER_CONFIRMED"`) is recorded. | `src/actions/handover.ts`<br>`src/lib/audit.ts` |
| **AC-4: The item is added to the admin-only found-item feed after confirmation** | Verified inventory dashboard at `/admin/inventory` restricted strictly to administrators. Confirmed items transition immediately into this custody feed, showing the handover timestamp and the confirming admin. | `src/app/admin/inventory/page.tsx`<br>`src/queries/handover.ts` |

---

## 2. Scope & Role Boundaries

- **Admins do NOT submit found reports**: Found reports are submitted by the campus finders who discovered the items (part of US-01). 
- **Admins ONLY manage custody intake and inventory**: Once a finder brings an item to the campus administration office, the admin uses US-02 to physically inspect the item, verify the reference ID, and confirm receipt into custody.
- **Seeded Finder Reports**: To make US-02 immediately testable without requiring US-01 implementation, the seed script (`prisma/seed.ts`) populates sample pending reports submitted by a student finder (`student@iut-dhaka.edu`).

---

## 3. Specifically What Was Implemented (New Files)

### A. Database Migration & Utilities
1. **`prisma/migrations/20261123165146_add_found_and_audit/migration.sql`**
   - Creates the `FoundStatus` enum (`PENDING_HANDOVER`, `IN_CUSTODY`, `RETURNED`).
   - Creates the `found_report` table with status indexes and foreign keys to `user` (finder & confirming admin).
   - Creates the `audit_event` table for compliance and audit trail tracking.
2. **`src/lib/audit.ts`**
   - Helper function `logAuditEvent(tx, { actorId, action, entityId })` ensuring audit events are executed inside an active Prisma transaction client.
3. **`src/lib/storage.ts`**
   - S3 / RustFS client configuration.
   - `getPresignedViewUrl(key)`: Generates short-lived (15-minute) signed `GET` URLs so private item photos can be viewed securely by administrators.

### B. Server Actions & Queries
4. **`src/actions/handover.ts`**
   - Server Action `confirmHandover({ reportId })`:
     - **Authorization Guard:** Calls `await requireAdmin()`. Non-admins are redirected to `/`.
     - **Validation:** Parses input using `confirmHandoverSchema`.
     - **Database Transaction (`db.$transaction`):** Verifies report existence and that status is `PENDING_HANDOVER`, updates status to `IN_CUSTODY`, sets `handedOverAt: new Date()`, sets `confirmedById: admin.id`, and logs `AuditEvent` with `action: "HANDOVER_CONFIRMED"`.
     - **Revalidation:** Calls `revalidatePath("/admin/handovers")` and `revalidatePath("/admin/inventory")`.
5. **`src/queries/handover.ts`**
   - `getPendingHandovers({ search, category })`: Fetches pending handover items, includes finder information, and signs image URLs via S3 presigner. Supports search across report ID, item name, location, and student ID.
   - `getFoundInventory({ search, category })`: Fetches in-custody items with finder details, confirming admin details, and handover timestamps.
   - `getFoundReportByReportId(reportId)`: Single report lookup helper.

### C. UI & Components
6. **`src/components/AdminNav.tsx`**
   - Navigation header for admin views: links between **Pending Handovers** (`/admin/handovers`) and **Found Inventory** (`/admin/inventory`), displays the admin badge and sign-out button.
7. **`src/components/HandoverActions.tsx`**
   - `ConfirmHandoverButton`: Interactive button on each pending card featuring a confirmation prompt, React 19 `useTransition` pending state, and `sonner` toast notifications.
   - `QuickConfirmBar`: Direct text input allowing admins to immediately confirm receipt by typing or scanning a Report ID (e.g. `LF-2026-000001`).
8. **`src/components/HandoverFilters.tsx`**
   - Search input and category filter pills (`Electronics`, `Keys`, `Cards & IDs`, etc.) updating URL search params cleanly without full page reloads.
9. **`src/app/admin/layout.tsx`**
   - Server layout with `requireAdmin()` guard preventing non-admins from rendering admin pages.
10. **`src/app/admin/handovers/page.tsx`**
    - Main US-02 view: renders pending handover cards, photo previews, finder details, category filters, quick confirm input, and receipt confirmation buttons.
11. **`src/app/admin/inventory/page.tsx`**
    - Official found-item feed: lists all confirmed items in administrative custody with handover timestamp, confirming admin, and finder details.

---

## 4. Specifically What Was Changed in Existing Files

| File | Changes Made |
|---|---|
| **`prisma/schema.prisma`** | Added relations on `User`: `foundReports`, `confirmedHandovers`, and `auditEvents`. Added `FoundStatus` enum and `FoundReport` and `AuditEvent` models. |
| **`prisma/seed.ts`** | Added initialization for sequence `found_report_seq`, seeded sample student finder `student@iut-dhaka.edu`, seeded 2 pending handovers (`LF-2026-000001`, `LF-2026-000002`), and 1 confirmed item (`LF-2026-000003`). |
| **`src/lib/schemas.ts`** | Added `ITEM_CATEGORIES` constant array and `confirmHandoverSchema`. |
| **`src/lib/auth.ts`** | Explicitly passed `secret: process.env.BETTER_AUTH_SECRET` and `baseURL: process.env.BETTER_AUTH_URL` to ensure Better Auth is properly configured. |
| **`src/app/page.tsx`** | Updated home page with shortcuts for administrators (`/admin/handovers`, `/admin/inventory`). |
| **`next.config.ts`** | Streamlined Turbopack CSS loader rule to `loaders: ["@tailwindcss/turbopack"]` ensuring compatibility with Next.js 16 App Router and Turbopack. |
| **`docker-compose.yml`** | Mapped PostgreSQL host port to `5433:5432` to avoid local bind collisions with pre-existing PostgreSQL on port `5432`. |
| **`.env`** | Added generated `BETTER_AUTH_SECRET`, updated `DATABASE_URL` port to `5433`, and set `SKIP_EMAIL_VERIFICATION="true"` for local development. |
| **`docs/development.md`** | Updated status section to document US-02 completion and note other user stories as planned. |

---

## 5. Security & Access Control Measures

1. **Strict Admin Restriction:**
   - **Middleware (`src/proxy.ts`):** Redirects any non-authenticated requests to `/login`.
   - **Server Guards (`src/lib/guards.ts`):** `requireAdmin()` checks session user role; non-admins are redirected to `/`.
   - **Server Action Protection (`src/actions/handover.ts`):** `confirmHandover` invokes `await requireAdmin()`, making it impossible for non-admins to confirm handovers even via direct API calls.
2. **Private File Storage:**
   - Photos uploaded to S3 are stored privately; signed view URLs expire after 15 minutes.
3. **Immutable Audit Trail:**
   - Every handover confirmation writes an immutable `AuditEvent` inside the same database transaction.

---

## 6. How to Test and Verify US-02

### Prerequisites & Running the System
```bash
bun run db:up   # starts PostgreSQL (port 5433) and S3 RustFS (ports 9000/9001)
bun run dev     # runs the Next.js dev server on http://localhost:3000
```

### Credentials
- **Admin account:**
  - Email: `admin@iut-dhaka.edu` (or username `admin`)
  - Password: `change-me-123`
- **Student account:**
  - Email: `student@iut-dhaka.edu`
  - Password: `password123`

---

### Step-by-Step Testing Guide

#### 1. View Pending Handover Requests (AC-1)
1. Go to [http://localhost:3000/login](http://localhost:3000/login) and log in with admin credentials.
2. Open [http://localhost:3000/admin/handovers](http://localhost:3000/admin/handovers).
3. Verify the pending requests reported by campus finders:
   - `LF-2026-000001`: *Black HP 65W Laptop Charger* (Library 2nd Floor Study Room)
   - `LF-2026-000002`: *Set of 3 Keys with Red IUT Lanyard* (Cafeteria Main Counter)
4. Test filtering:
   - Click the **"Keys"** category pill: only the keys item appears.
   - Type `Library` in the search box: only the charger appears.
   - Reset the filters to display all items again.

#### 2. Confirm Physical Handover (AC-2 & AC-3)
1. Click **"Confirm Receipt"** on item `LF-2026-000001`.
2. Confirm the browser prompt.
3. Observe the success toast notification. Item `LF-2026-000001` is removed from the pending list.
4. Test the **Quick Confirm bar**: enter `LF-2026-000002` into the input and click **"Confirm"**.
5. Observe that `LF-2026-000002` is confirmed and removed from pending handovers.

#### 3. View Confirmed Items in Admin Feed (AC-4)
1. Navigate to [http://localhost:3000/admin/inventory](http://localhost:3000/admin/inventory).
2. Verify that the confirmed items are now present:
   - Status badge shows `In Custody`.
   - `Handover confirmed:` shows the exact date and timestamp when you clicked confirm.
   - `Confirmed by:` shows `Admin`.
   - Finder name (`Tanzim Ahmed`) and student ID (`210041234`) are clearly recorded.

---

## 7. Automated Quality Checks

Run the project verification commands:

```bash
bun run fmt:check    # Prettier formatting check (passes with 0 errors)
bun run lint         # ESLint checks (passes with 0 errors, 0 warnings)
bun run typecheck    # TypeScript compiler check (passes with 0 errors)
bun run build        # Production Next.js Turbopack build (passes successfully)
```
