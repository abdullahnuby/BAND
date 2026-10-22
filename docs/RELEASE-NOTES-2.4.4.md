# BAND 2.4.4 — Real workspace rendering fix

- Fixed the shared table renderer so read-only material summary tables do not try to access `S[undefined][i].id`. This was the runtime error that left the previous welcome screen on display when the contractor and apartment-estimate workspaces attempted to render.
- The mobile module picker and ordinary navigation now explicitly switch to the contractor workflow when opening `materials`, or the apartment-estimate workflow when opening `apartmentEstimate`. Other modules resolve to an allowed workflow rather than silently falling back to the welcome screen.
- Added a visible render-error state and retry/back actions so a future render failure cannot masquerade as a successful route change.
- Regression coverage added for routes and read-only tables.
