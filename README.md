# BAND — Engineering Quantity Takeoff Platform

BAND is an Arabic, RTL-first construction quantity-takeoff workspace. Version 2.1 expands the takeoff into structural concrete, excavation/filling, masonry wall volume by thickness, insulation by selectable unit, finishes, and dedicated measurement-sheet printing. It keeps local browser storage and JSON backup; optional account-based cloud workspaces use PostgreSQL.

## Current capabilities

- Masonry volume in m³ from net wall area × per-wall thickness (cm converted to m), alongside plaster/paint wall and ceiling areas with per-wall opening deductions.
- Structural concrete quantities for foundations, columns, beams, slabs and other elements, with optional manually measured rebar mass and formwork area.
- Excavation, backfill, imported fill and spoil-removal items in m³, with explicit volume deductions and separate work types.
- Waterproofing, thermal and acoustic insulation in m², m³, linear metres or count, with thickness required for volume measurement.
- Floor finishes (marble, ceramic, tile, porcelain, granite, custom materials).
- Timber, aluminium, UPVC and other doors/windows, with operation and opening direction.
- Sanitary fixture counts by location.
- Marble stair items by area, linear metre, or count, including treads, risers, skirting and side cladding.
- Facades with opening deductions and multiple finish layers.
- A dedicated A4 landscape measurement-sheet report for the selected module or project, with project metadata, section summaries, repeating table headers and print-only content; module CSV exports and JSON backup/restore.
- Optional cloud accounts, per-user projects, server-side persistence and cross-device project loading/saving.

## Architecture

```text
Browser (public/index.html)
  ├─ Existing engineering takeoff UI + localStorage fallback
  └─ Same-origin /api calls
       ├─ api/[...path].js            Vercel Node function entry
       └─ src/server/app.js           Shared API/request handler
            ├─ config/env.js          Environment configuration
            ├─ services/auth.service.js
            ├─ services/projects.service.js
            ├─ domain/workspace.js    Payload validation and sanitization
            ├─ domain/calculations.js Tested engineering formulas
            └─ db/pool.js + migrations PostgreSQL/Neon persistence
```

The database separates users, sessions, projects, project items and audit events. Each top-level takeoff record is stored as a separate `project_items` row; the current room record carries its nested walls/openings in a JSONB payload to preserve the current model. Project saves are transactional and use `workspace_version` optimistic concurrency so stale sessions cannot silently overwrite newer edits.

## Requirements

- Node.js 20 or newer.
- PostgreSQL; Neon PostgreSQL is the recommended hosted option.
- A pooled `DATABASE_URL` connection string for Vercel/serverless deployment.

## Local setup

```bash
npm install
cp env.example .env
```

Set `DATABASE_URL` in `.env` to your development database and set `APP_ORIGIN=http://localhost:4173`. Never commit `.env`.

```bash
npm run db:migrate
npm test
npm run build
npm run dev
```

Open `http://localhost:4173`. The static takeoff UI can be opened even without a database, but sign-up, sign-in and cloud projects require `DATABASE_URL` and a completed database migration.

## Cloud account behavior

Open **حساب / مزامنة** in the app to create an account or sign in. Passwords are hashed using Node's built-in scrypt implementation. Sessions use random opaque tokens in `HttpOnly` cookies; only a SHA-256 hash of the session token is stored in PostgreSQL. Use a password at least 12 characters long.

After sign-in, create a cloud project from the current local state, or select an existing cloud project and choose whether to load it or save the current state. Auto-save starts only after a successful explicit save or load. If another session changes the same project version, BAND stops auto-save and asks the user to load the latest copy before writing again.

The current release does not include email verification, password reset, organization/team sharing, billing, or a distributed rate limiter. Add those before offering the service broadly to the public.

## Database migrations

Migrations are numbered SQL files in `src/server/db/migrations/`. Run `npm run db:migrate` against the intended database before the first deployment. Migrations are deliberately not run from the production build command.

## Vercel deployment

1. Push this project to the `main` branch of a GitHub repository.
2. Import that repository into Vercel with the repository root as the root directory.
3. Set `DATABASE_URL` to the Neon pooled connection string, `NODE_ENV=production`, `APP_ORIGIN` to the production origin, and optionally `SESSION_DAYS=14`.
4. Run the database migration from a trusted local environment against the production database.
5. Deploy. Check `/api/health` for the API/database status and test account creation plus saving/loading a small project.

Vercel serves `dist/` as static assets and `api/[...path].js` as the Node.js API. The same request handler serves static files during local development.

## Tests and checks

```bash
npm test
npm run build
```

The tests cover Arabic decimal parsing, wall/opening deductions, masonry thickness-to-volume conversion, concrete and earthwork volumes, insulation in four measurement units, ceiling treatment, floors, doors/windows, stairs, facades and workspace payload validation. The build checks server/API JavaScript syntax and the in-page application script before preparing `dist/`.

## Engineering measurement basis

Read [`docs/MEASUREMENT-RULES.md`](docs/MEASUREMENT-RULES.md) before using output on live work. Wall corner/intersection lengths, opening deduction conventions, backfill compaction, and BOQ units must follow the project contract and specifications. BAND is a geometry-first takeoff aid, not a formally certified or universally contract-compliant measurement engine. Verify quantities against drawings before procurement/valuation/contractual approval. The server currently persists whole workspaces transactionally by replacing each project's module records, which is suitable as an initial cloud-sync design; high-volume collaboration should move to per-record/module mutation endpoints and explicit change events.
