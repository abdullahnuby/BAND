# BAND 2.2.2 — تعليمات النشر

# Deploy BAND on Vercel + Neon

## Environment variables

| Key | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes for cloud features | Use the Neon pooled connection URL. Keep it secret. |
| `NODE_ENV` | Recommended | Set to `production` on Vercel. Enables Secure session cookies. |
| `APP_ORIGIN` | Recommended | The canonical site origin, without a trailing slash. Same-origin preview requests are also accepted. |
| `SESSION_DAYS` | Optional | Session duration, 1–30 days; default 14. |
| `AUTH_RATE_LIMIT` | Optional | Authentication requests per IP/key per 15-minute in-memory window; default 12. |

## First deployment checklist

- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] Apply numbered SQL migrations from a trusted environment before using cloud APIs.
- [ ] Configure environment variables in Vercel Preview/Production as needed.
- [ ] Confirm `/api/health` returns `database: connected`.
- [ ] Register a test user, create a project, save, refresh, and load it.
- [ ] Verify a second user cannot access the first user's project by changing the project ID.
- [ ] Configure database backups/retention on the database provider.

Do not put production database URLs in GitHub commits, screenshots, client-side JavaScript, or build logs. Never run production migrations as an unconditional build step.

## Vercel details

- Framework: Other / no framework.
- Build command: `npm run build`.
- Output directory: `dist`.
- API entry: `api/[...path].js`.
- Node.js: 22.x recommended.
