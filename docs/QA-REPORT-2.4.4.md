# BAND 2.4.4 — QA report

## Root cause reproduced

The shared `tableHtml(headers, rows, mod)` renderer always appended an edit/delete column and read `S[mod][i].id`. Read-only material tables called it without `mod`, throwing `Cannot read properties of undefined (reading '0')`. Since `render()` assigned the new HTML only after building the page string, the previous welcome page remained visible even though the selected mode changed. This reproduced the exact symptom from the user screenshots.

## Fixes

- Read-only summary tables now render without an actions column. Editable measurement tables preserve their edit/delete buttons.
- The module picker and navigation resolve `materials` to the contractor workflow and `apartmentEstimate` to the apartment-estimate workflow.
- A render failure now shows a visible recovery panel and retry/back actions instead of leaving stale content on the screen.

## Verification

- `npm test`: all automated tests passed after adding route-selection and renderer regression tests.
- `npm run build`: passed and checked server/API JavaScript plus inline HTML scripts.
- Chromium interaction test against the local built application: clicked the contractor mode card, confirmed the contractor form was rendered, selected reinforced concrete, entered 10 m³ and submitted a contractor row; returned to welcome, opened apartment estimation, entered a 4 × 3.5 × 3 m room with opening areas, and confirmed the estimate outputs appeared. The mobile picker switch from estimation to materials also opened the contractor workspace. No runtime errors were reported in this test harness.

The hosted Vercel deployment was not updated or verified by this local test.
