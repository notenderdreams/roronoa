<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project rules (Roronoa)

Read `docs/development.md` first: stack, structure, conventions, decisions. Bun only: never `npm`, `npx`, `yarn` or `pnpm`.

### Don't build from scratch: look it up first

When something is unfamiliar or non-trivial (auth flows, file uploads, email, scoring/matching, video/CCTV, date handling, anything with security or edge cases):

1. Check this codebase for an existing helper or pattern. Reuse it.
2. Check the platform: Next.js docs in `node_modules/next/dist/docs/`, then the web platform and stdlib.
3. Search GitHub and npm for a maintained library or reference implementation (recent releases, real usage, compatible with Bun, Next 16 and React 19). Read its docs and source before using it.
4. Only then write it yourself, and say why nothing existing fit.

Before adding a dependency, check its repo, maintainers and last release. Prefer official or well-known packages. Say what you chose and what you rejected. Never invent API names from memory when a doc or source can be read.

### Review phase after every code change

After finishing any AI-made code change, stop and review the whole change against the whole codebase before reporting done:

1. **Re-read the diff** (`git diff`), not just the files you meant to touch.
2. **Check it against the codebase**: duplicates an existing helper? follows the conventions in `docs/development.md` (server action order, `requireUser()`/`requireAdmin()` in every protected action and page, Zod parse at boundaries, audit event in the same transaction)? breaks other callers, routes, types, or the Prisma schema and migrations?
3. **Run the same checks CI runs**: `bun run fmt:check`, `bun run lint`, `bun run typecheck`, `bun run build`. Fix every failure.
4. **Look for leftovers**: unused code or dependencies, stray files, debug logs, secrets, TODOs, stale docs.
5. **Update `docs/development.md`** if behavior, structure, env vars or decisions changed.
6. **Report honestly**: what changed, what was verified and how, what was not tested.

Do not commit, push or run destructive git commands unless asked.
