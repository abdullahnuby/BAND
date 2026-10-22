# BAND API reference

All paths are same-origin and JSON is used for request/response bodies. Authenticated calls use the `band_session` HttpOnly cookie. Do not send an owner ID; the API derives the owner from the validated session.

## Health

`GET /api/health`

Returns service status and database configuration/connection state. It does not expose connection details.

## Authentication

- `POST /api/auth/register` — `{ "name": "...", "email": "...", "password": "at least 12 characters" }`
- `POST /api/auth/login` — `{ "email": "...", "password": "..." }`
- `GET /api/auth/me` — current user.
- `POST /api/auth/logout` — revokes current session and clears cookie.

Register and login return `{ "user": { "id", "email", "name", "createdAt" } }`. Sessions expire after `SESSION_DAYS` (default 14 days).

## Projects

- `GET /api/projects` — list projects owned by the current user.
- `POST /api/projects` — `{ "name": "Project name", "description": "optional" }`.
- `GET /api/projects/:projectId` — project metadata.
- `PATCH /api/projects/:projectId` — update `name` and/or `description`.
- `DELETE /api/projects/:projectId` — soft-delete the project.
- `GET /api/projects/:projectId/workspace` — return project metadata, workspace, and current version.
- `PUT /api/projects/:projectId/workspace` — save `{ "version": 3, "state": { "meta": {}, "rooms": [], "concrete": [], "earthworks": [], "insulation": [], "floors": [], "doorsWindows": [], "sanitary": [], "stairs": [], "facades": [] } }`.

`version` is mandatory when saving. If the server has a newer version, the API responds with HTTP 409 / `WORKSPACE_VERSION_CONFLICT`; load the latest workspace before saving again.

## Error format

```json
{
  "error": {
    "code": "INVALID_WORKSPACE",
    "message": "Readable error message"
  }
}
```

Common status codes: `400` invalid input, `401` missing/expired session, `403` origin blocked, `404` project/path not found, `409` version conflict or duplicate account, `413` oversized body, `429` authentication throttle, `503` database not configured/unavailable.
