# BAND 2.2.1 — Quantity logic and duplication safeguards

## What changed

- Removed masonry volume from room-based quantities. Room records now represent finishing faces and ceilings only.
- Added an independent physical masonry wall register with required unique wall references, per-wall thickness, openings, unit selection, and per-wall junction deductions.
- Default unit suggestion: thickness up to 15 cm suggests m²; thickness 20 cm and above suggests m³; intermediate thicknesses require explicit choice. Contract BOQ overrides the suggestion.
- Fixed masonry report and CSV export to use `masonryWalls`, with m² and m³ reported in separate sections.
- Concrete and earthwork sheets now show gross quantity, deduction per element, and net quantity after multiplying consistently by count.
- Block deductions exceeding remaining masonry quantity, concrete/earthwork deduction greater than the single-element gross volume, invalid opening totals, and obvious duplicate takeoff lines.
- Added an audit warning before reports, CSV exports, and cloud saving; invalid/duplicate data must be reviewed instead of silently appearing as certified quantities.
- Uses the same canonical calculations module in browser and backend validation.
- Builds `quantity-rules.js` into `dist` so the browser calculation module is deployed with the app.

## Important measurement limitation

BAND can flag obvious duplicates by identifiers/location/dimensions, but cannot mathematically infer every physical overlap from dimensions alone. Wall axes/locations and measurement extents must be identified consistently from the drawings. Contract measurement rules determine opening deductions, unit conventions, and element-junction treatment.

## Validation

Run:

```bash
npm test
npm run build
```


### مراجعة منطق الحصر 2.2.1
- الاقتراح التلقائي لوحدة المباني اقتصر على 12.5 سم أو أقل للم² و24.5 سم أو أكثر للم³، وما عدا ذلك يطلب اختيارًا صريحًا.
- تدقيق مشترك قبل الطباعة والتصدير والمزامنة لخصومات الفتحات والخصومات السالبة ووحدات/أبعاد البيانات والتكرارات المطابقة.
- تحقّق الواجهة والخادم من أن عرض/ارتفاع كل فتحة لا يتجاوز أبعاد سطحها.
- التكرارات الواضحة في الخرسانات والحفر والردم والأرضيات والأبواب والشبابيك والأجهزة الصحية والسلالم والواجهات تُرفض في الحفظ السحابي؛ الإحداثيات غير الموجودة لا تتيح كشف كل تداخل مكاني تلقائيًا.
