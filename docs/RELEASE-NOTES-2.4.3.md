# BAND 2.4.3 — Fix contractor and estimate workspaces

- Fixed a runtime crash in the shared table renderer. Material summary tables are read-only and do not have an editable module key; the previous renderer still attempted to access `S[undefined][i].id`, leaving the previous welcome screen visible after route state changed.
- Editable measurement tables keep their edit/delete controls. Read-only material summary tables now render without an actions column.
- Added a regression test for the shared table renderer contract.
