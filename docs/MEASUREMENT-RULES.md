# Engineering Measurement Rules — BAND

BAND gives a transparent geometric takeoff. It does not replace the project specifications, approved drawings, contract bill-of-quantities rules, or the quantity surveyor's review.

## 1. Units and dimensional inputs

- All length dimensions are entered in metres unless a field explicitly says centimetres.
- Masonry wall thickness is entered in centimetres and converted to metres inside the volume formula.
- Concrete and earthwork volumes are calculated in m³.
- Surface finishes are generally m²; items such as skirting or sealant can be measured in linear metres; countable fixtures use number/count.
- BAND never combines distinct units into one numerical total in the insulation/stair reports.

## 2. Masonry

Per wall:

`net wall area = max(0, gross wall area - measured opening area)`

`masonry volume (m³) = net wall area (m²) × wall thickness (cm) / 100`

Each wall can have its own thickness; otherwise it inherits the room's default thickness (12 cm for a newly created room). The user must check wall lengths at corners and intersections against the chosen measurement basis to avoid duplicated junction volumes. BAND deducts all entered openings from the area; if the project's contract rules define thresholds or exceptions for opening deductions, those rules must be applied before contractual certification.

## 3. Concrete

`concrete volume (m³) = dimension 1 × dimension 2 × dimension 3 × quantity`

Use dimensions in a way that matches the element: length × width × thickness for slabs/footings; section width × section depth × column height for columns; beam length × beam width × beam depth for beams. Reinforcement mass and formwork surface are independent quantities and are recorded manually when known; the tool does not infer them from concrete volume.

## 4. Excavation and filling

`gross volume (m³) = length × width × depth × quantity`

`net entered quantity (m³) = max(0, gross volume - explicitly entered deduction volume)`

Excavation, backfill, imported fill, and surplus-soil disposal should be recorded as distinct items; their totals should not be added into one overall earthwork figure. The compacted final thickness and source/type of fill should follow the project specification. Excavated loose volume and compacted fill volume are not automatically assumed equal.

## 5. Insulation

The unit is selected per item:

- m²: length × width × quantity
- m³: length × width × thickness-in-metres × quantity
- linear metre: length × quantity
- count: quantity

Use the unit and description specified by the BOQ or material schedule. Do not enter membrane thickness when the work item is measured only in m².

## 6. Plaster, paint, floors, openings and façades

- Wall surface = width × height, minus the openings entered on that wall.
- Plaster and paint summaries include the net wall areas plus room ceiling areas.
- Floor finish = length × width × count.
- Door/window item area = width × height × count; unit count remains visible separately.
- Façade finish areas are based on the façade's net surface or the user-selected manual area/percentage. Distinct finish layers may repeat the same physical surface and should not be added as if they were a single material quantity.

## 7. Reports and approval

Print/PDF is generated from a separate A4-landscape measurement-sheet template, not by printing the application's inputs/navigation. Table headers repeat across pages; each section has a quantity summary with unit-aware notes. The final PDF must still be reviewed against the current drawings and the contract's measurement rules before it is used for procurement, valuation, or payment.

## Reference framework

The Royal Institution of Chartered Surveyors' New Rules of Measurement (NRM) provides a structured measurement framework and distinguishes work sections such as excavating/filling, in-situ concrete, masonry and waterproofing. Its current NRM page also states that users must check templates and embedded logic against the specific calculation requirements. BAND uses that as a general organisational reference, not as a claim of formal certification or universal compliance:

- https://www.rics.org/profession-standards/rics-standards-and-guidance/sector-standards/construction-standards/nrm
- https://www.rics.org/content/dam/ricsglobal/documents/standards/nrm_2_detailed_measurement_for_building_works_1st_edition_rics.pdf
