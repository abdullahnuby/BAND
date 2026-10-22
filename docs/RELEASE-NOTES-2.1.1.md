# BAND 2.1.1 — Test hardening patch

- Browser-driven smoke-tested the masonry, concrete, earthworks, insulation and report flows.
- Hardened import/local state normalization against null or malformed records so one bad earthworks entry cannot break rendering.
- Added a safe fallback label for missing earthwork kind values.
- Confirmed the dedicated print template outputs a landscape A4 report PDF rather than the full working interface.
