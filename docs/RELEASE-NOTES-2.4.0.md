# BAND 2.4.0 — Welcome-first workflow

## UX redesign
- First load opens a dedicated welcome page, not an active quantity screen.
- Three explicit route cards: Engineering Takeoff, Contractor & Materials, and Quick Apartment Estimate.
- Each route opens its own dashboard/workspace and keeps the relevant modules in navigation.
- A visible “تغيير طريقة العمل” control returns to the welcome page from any workspace page.
- Removed the confusing global mode chips above the workspace.
- Welcome page is responsive: clear cards on desktop, stacked cards on mobile, and no duplicate sidebar on the welcome screen.
- Existing project data remains untouched; only the initial UI route is reset to welcome.

## Verification
- `npm test` and `npm run build` should be run before deploying.
- No database schema changes are included.
