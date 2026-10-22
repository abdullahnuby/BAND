-- Store masonry as unique physical wall runs, independent of room-side finish faces.
ALTER TABLE project_items DROP CONSTRAINT IF EXISTS project_items_module_check;
ALTER TABLE project_items
  ADD CONSTRAINT project_items_module_check
  CHECK (module IN ('rooms','masonryWalls','concrete','earthworks','insulation','floors','doorsWindows','sanitary','stairs','facades'));
