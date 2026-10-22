# Deployment notes

## Vercel settings

- Framework preset: **Other** / no framework
- Root directory: `.`
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install --ignore-scripts`
- No environment variables are required for the static app.

The project is configured through `vercel.json` with basic browser security headers. No API routes or serverless functions are expected.

## Git-based continuous deployment

1. Push this project to a GitHub repository.
2. Import the repository into Vercel.
3. Set the production branch to `main`.
4. Deploy once and verify each module, local saving, CSV export, JSON backup/restore, and printing.
5. Subsequent commits to `main` trigger production deployments through the Git integration.
