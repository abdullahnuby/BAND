# BAND 2.3.1 — Contractor quantities and apartment estimate refinements

- Added shared helper to group apartment floor material requirements by finish, tile dimensions, method, and waste percentage.
- Added tile length/width inputs for each apartment room; procurement summary lists tile quantities per distinct finish/format.
- Kept cement, sand, screed and adhesive summary at project-area level to avoid double-rounding bag quantities across tile groups.
- Shows the per-item insulation consumption rate in the insulation schedule.
- Hides custom-brick dimensions unless the user selects custom brick format.
- Adds tests for mixed tile formats, facade glass vs panelized cladding, configurable sealer packs, and per-insulation-product rates.
- Documents the limitations of illustrative material assumptions in `docs/MATERIAL-RATES.md`.

All consumption rates remain adjustable estimates; confirm them against approved specifications and manufacturer data before procurement.
