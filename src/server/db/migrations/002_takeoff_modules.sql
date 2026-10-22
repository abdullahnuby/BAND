-- Add structural, earthwork and insulation modules for existing BAND workspaces.
ALTER TABLE project_items DROP CONSTRAINT IF EXISTS project_items_module_check;
ALTER TABLE project_items
  ADD CONSTRAINT project_items_module_check
  CHECK (module IN ('rooms','concrete','earthworks','insulation','floors','doorsWindows','sanitary','stairs','facades'));
