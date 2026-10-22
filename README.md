# BAND — Engineering Quantity Takeoff

**BAND** is an Arabic, right-to-left, browser-based tool for organizing quantity takeoff for building works and finishes. The current edition is a static web app: no backend, account system, or database is required.

## Included modules

- **Building / plaster / paint:** define rooms and spaces, edit each wall, record multiple door/window/opening deductions per wall, and calculate net wall areas. Plaster and paint add the ceiling area.
- **Floor finishes:** marble, ceramic, tiles, porcelain, granite, or custom material; area is calculated from length × width × quantity.
- **Doors and windows:** aluminium, timber, UPVC, or custom; dimensions, type, operation, quantity, and opening direction.
- **Sanitary fixtures:** quantity list grouped by location with make/model and notes.
- **Marble stairs:** full step, tread, riser, skirting, side cladding, or custom item; calculation by dimensions, linear metres, or item count.
- **Facades:** overall facade dimensions, opening deductions, and multiple finishes per facade, using net area, manual area, or a percentage of net area.
- **Project details, print/PDF via the browser, CSV export for Excel, and JSON backup/restore.**

## Requirements

- Node.js 18 or later for local scripts.
- A modern browser (Chrome, Edge, Firefox, or Safari).

No npm runtime dependencies are used.

## Run locally

```bash
npm run dev
```

Open `http://localhost:4173`.

## Build and test

```bash
npm test
npm run build
```

The static production output is written to `dist/`.

## Deploy on Vercel

This repository includes `vercel.json`. Import the GitHub repository into Vercel with the root directory set to the repository root. Vercel uses `npm run build` and serves `dist/`.

## Publish to GitHub

Create a new repository named `BAND` or `band-quantity-takeoff`, then run these commands from this directory:

```bash
git init
git add .
git commit -m "Initial BAND quantity takeoff release"
git branch -M main
git remote add origin https://github.com/<your-account>/BAND.git
git push -u origin main
```

After the repository is pushed, import it in Vercel to enable automatic deployments on pushes to `main`.

## Data and limitations

- Entries are stored in the current browser's `localStorage`. They are **not synced** across browsers or devices; export a JSON backup regularly.
- CSV exports open in Excel but are not native `.xlsx` workbooks.
- Printing/PDF uses the browser print dialog.
- Quantities are engineering aids, not a substitute for checking site dimensions, measurement conventions, specifications, and contract rules before approval.
