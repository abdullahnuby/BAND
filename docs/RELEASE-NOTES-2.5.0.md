# BAND 2.5.0 — Simpler apartment estimate and contractor workspace

## Main changes

- The apartment estimate asks for room name/type and dimensions first; individual door, window, ventilation, and other openings are entered by width, height, and count.
- BAND calculates each opening area automatically and deducts the total from room wall-face finishes. Users no longer need to calculate or type opening areas themselves.
- The room form keeps tile format choices in an optional collapsed section; the common format is used by default.
- Apartment totals are summarized in compact cards. The long line-item calculation table and assumptions are hidden in a collapsed “details” section until requested.
- Contractor workflow prioritizes its direct quantity-to-material form and shows each computed procurement result as a compact card. Engineering takeoff summaries and detailed rate settings are optional and collapsed by default.
- Detailed material-consumption rates no longer fill the default screen. They remain editable under “Advanced material consumption settings”.
- Old saved apartment records that used aggregate opening areas remain supported for backward compatibility.

## Verification

- `npm test`: 49 tests passed.
- `npm run build`: passed, including JavaScript syntax validation.
- New checks cover opening-area calculation from dimensions/counts, opening fit validation, advanced-rate disclosure state, and simplified-screen content.

Material rates remain indicative and must be checked against product data and project specifications before procurement.
