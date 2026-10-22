# BAND 2.5.2 — Owner-first apartment / building estimate

- The estimate flow now asks only for property type, floor area, room counts, current stage, and finish level as required inputs. Facade, balcony, window, floor finish, and facade finish choices are under a collapsed optional section.
- If the user leaves exterior-window count blank, the estimate infers a default from room counts and clearly labels it as an assumption.
- Budget now separates an indicative material allowance (65%) from labor/workmanship (35%) and lists broad cost ranges by major trade. Cost shares are planning assumptions and reconcile to the same total estimate.
- Budget rails were widened to reflect that publicly available 2026 Egypt market calculators differ materially in inclusions, price level, supervision and location. References and limitations appear in `docs/MATERIAL-RATES.md`.
- Estimates remain a transparent rules-based benchmark, not an ML model trained on hundreds of verified Egyptian bills of quantities.
- Added tests for cost-breakdown reconciliation, materials/labor split, omitted-window inference, and the simplified owner form.

## Known limitations

Floor area and room counts cannot reveal actual room dimensions, external wall lengths, structural framing, plumbing routes, electrical routes, window sizes, tile cut plans, facade construction details, or local supplier quotes. Masonry, finish surfaces and trade cost shares are preliminary ranges. Validate against actual drawings and project quotes before purchasing or contracting.
