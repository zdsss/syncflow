-- Add snapshot_json column to bom_version for version comparison feature
ALTER TABLE bom_version ADD COLUMN snapshot_json TEXT;

COMMENT ON COLUMN bom_version.snapshot_json IS 'JSON snapshot of BOM item tree at this version point';
