# Security notes

- Keep `.env` out of version control; use Vercel environment variables for hosted secrets.
- Passwords are hashed with Node.js `scrypt`; plain passwords are never stored.
- Session tokens are random, sent in `HttpOnly; SameSite=Lax` cookies, marked `Secure` in production, and stored as SHA-256 hashes in the database.
- All project access is scoped by the authenticated owner ID. IDs supplied by clients are never treated as authority.
- Mutating requests validate the origin; JSON input is size-limited; workspace item counts and record payload sizes are bounded.
- The current auth limiter is per-process only. Use a shared distributed limiter before large-scale production traffic.
- This MVP does not yet include verified email, password reset, MFA, organization membership or account recovery. Plan and test these before public launch.
- Audit events intentionally store counts/version, not whole project payloads or secrets.

Report potential vulnerabilities privately to the repository owner. Do not publish database URLs, session cookies, user data, or production logs in public issues.
