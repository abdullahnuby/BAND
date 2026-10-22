# BAND 2.4.1 — Working entry paths

- Selecting “حصر المقاول والخامات” now opens the interactive material-entry workspace directly rather than a static intermediate landing page.
- Selecting “تقدير شقة سريع” now opens the room-entry form directly.
- Added a saved direct quantity-entry register for contractor material estimates: concrete, masonry and brick, plaster, paint, floors, insulation, timber doors, cladding panels, and glazing.
- Each direct-entry row calculates an estimated purchase requirement using editable material rates and includes an explicit note about assumptions.
- Direct contractor entries remain separate from measured engineering quantities to prevent accidental double counting, and can be included in the contractor PDF/CSV report.
- Direct entries are retained in local JSON backups and the optional cloud workspace.
- Added tests for direct contractor calculations and workflow routing.
