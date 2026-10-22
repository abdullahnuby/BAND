# BAND 2.5.1 — Owner-first apartment and building estimate

- Replaced the room-by-room default estimate with a high-level guided estimator for owners who know only unit area, room counts, facade/balcony/window counts, current stage, and desired finish level.
- Supports one apartment or a repeated-layout building (unit area × floors × units per floor).
- Calculates indicative quantity bands for masonry/brick (only before masonry), plaster, floor finishes and waste, screed/mortar, paint materials, bathroom waterproofing, doors/windows, sanitary fixtures, facade finishes, and electrical point counts.
- Includes an editable broad budget range based on 2026 Egyptian-market published guides; includes stage adjustment assumptions and contingency; the total is explicitly not an official quote.
- Shows advanced calculation assumptions only in a collapsed details section; no room measurements are required in this workflow.
- Keeps the engineering takeoff path separate; detailed BOQ-based quantities remain more accurate when drawings are available.
- Adds pure calculation tests covering the 120 m² / 3-bedroom / 2-bathroom reference case, stage inclusion/exclusion, windows/façade effects, building multiplication, budget ordering, and invalid-area rejection.

## Known limitations

The quick estimator is a transparent rule-based benchmark, not a model trained on hundreds of verified local BOQs. Its wall factors, masonry distribution, and stage-cost multipliers are initial assumptions and need calibration against real measured projects and current supplier quotes. It does not calculate structural concrete from area alone, exact pipe/cable lengths, exact wall layout, or shop-drawing cut plans.
