# Architecture decision record

## Goals

- Keep the existing Arabic RTL takeoff UI and local-only workflow available.
- Separate structural concrete, earthworks, masonry volume, insulation and surface-finish modules while keeping all workspace data versioned.
- Introduce a same-origin API that works in local Node.js and Vercel Node functions.
- Isolate authentication, project authorization, validation, calculation helpers, and persistence.
- Use PostgreSQL/Neon, avoiding a provider-specific backend SDK.
- Make updates atomic and detect stale project versions.

## Data model

- `app_users`: account identity and scrypt password hash.
- `user_sessions`: hash of an opaque session token, expiry and lifecycle metadata.
- `projects`: owner, name, project settings and optimistic workspace version.
- `project_items`: module + record ID + order + JSONB payload, unique per project/module/record.
- `audit_events`: low-detail event trail for project creation and workspace saves.
- `schema_migrations`: migration ledger.

## Trust boundaries

The browser is untrusted. The API validates workspace structure and record sizes; the database is the source of truth for cloud workspaces. Every project read/write includes the authenticated owner ID. The server never accepts an owner ID from the client. Session bearer values exist only in HttpOnly cookies; only their hash is persisted.

## Concurrency

A client reads `workspace_version`. Save includes that version; the server locks the project row in a transaction and returns HTTP 409 if the value is stale. Records and project metadata are updated in one transaction, then the version is incremented. Client auto-save pauses on conflicts.

## Growth path

1. Add password-reset and verified-email flows through a transactional email service.
2. Move authentication throttling to a shared Redis-compatible store, with edge/API abuse protection.
3. Normalize rooms, walls, openings, concrete elements, earthwork items, insulation items and facade finishes into typed relational tables as real workloads demand it.
4. Add project membership and role-based access only when collaboration requirements are defined.
5. Introduce immutable revision history/change events, file/object storage for drawings, and background jobs for large report generation.
6. Add structured logs, error tracking, migration CI checks, and production backups/restore drills.

## Deliberate limits

The current sync endpoint replaces a project's module records in a single transaction. This is easy to reason about for initial cloud sync, but very large projects or simultaneous multi-user editing should move to per-record writes and finer-grained conflict detection.
