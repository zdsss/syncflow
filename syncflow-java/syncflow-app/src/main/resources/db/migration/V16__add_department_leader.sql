-- Add leader_id to sys_department so department head resolution is deterministic.
ALTER TABLE sys_department ADD COLUMN IF NOT EXISTS leader_id BIGINT;
COMMENT ON COLUMN sys_department.leader_id IS 'FK to sys_user.id, department leader/head';
