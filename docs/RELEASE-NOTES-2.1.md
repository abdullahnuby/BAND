# BAND 2.1 — Engineering Takeoff Review

- Split navigation into structure/site works, building/finishes, and reports.
- Added concrete takeoff in m³ with concrete/element type, location, three dimensions, quantity, and optional manually measured rebar/formwork amounts.
- Added excavation, backfill, imported fill, and spoil-removal items in m³, with explicit deductions.
- Added insulation takeoff in m², m³, linear metres or count; volume requires thickness in cm.
- Added wall thickness in cm per room default and per wall; masonry output is net wall area × thickness in metres, measured in m³.
- Reworked Print/PDF to use a standalone A4 landscape report template; it prints the takeoff sheet rather than the user interface.
- Added unit-aware report summaries and a CSV details register.
- Added database migration `002_takeoff_modules.sql` and expanded the workspace schema to persist new modules.
- Added calculation tests for masonry, concrete, earthworks and insulation units.

See `docs/MEASUREMENT-RULES.md` for formula basis, corner/intersection cautions and contract measurement disclaimers.
