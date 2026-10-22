# BAND 2.1.2 — Mobile UX update

## Changes

- Removed duplicate category navigation from the mobile home page; grouped category cards are now the primary entry point.
- Replaced the two-column mobile sidebar with a compact, horizontally scrollable category rail inside measurement modules.
- Reduced mobile header/action spacing and project stats height.
- Tightened category cards, descriptions, spacing, and single-card category groups to reduce unnecessary vertical scrolling.
- Preserved the existing wide-screen layout and print stylesheet.

## Verification

- `npm test`: 8 tests passed.
- `npm run build`: passed, including server/API JavaScript syntax and inline HTML script checks.
- Browser visual snapshot could not be verified in the managed Chromium environment; CSS and interaction state were checked in source and by build validation.
