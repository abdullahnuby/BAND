# BAND 2.4.2 — Working workspace routes

## Fixed
- Selecting **Contractor & Materials** now routes to the actual material-entry workspace (`materials`) rather than an intro-only dashboard.
- Selecting **Quick Apartment Estimate** routes straight to `apartmentEstimate`, where the room/space form is rendered.
- Legacy saved states that still point to `home` are normalized to the appropriate working module for contractor and estimate modes.
- The `home` route is removed from the navigation modules for contractor and estimate modes, preventing return to the dead-end intro screen.
- Added a shared route policy and regression tests.

## Validation
- Node unit/regression tests: 40 passing.
- Build and inline JavaScript syntax checks: passed.
- A live browser click-through could not be run in the restricted browser environment; production deployment must still be smoke-tested.
