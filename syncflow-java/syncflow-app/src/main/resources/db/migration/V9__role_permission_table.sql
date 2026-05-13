-- ============================================================================
-- SyncFlow V9 Role-Permission Join Table
-- Created: 2026-05-09
-- ============================================================================

-- ---------------------------------------------------------------------------
-- sys_role_permission: Many-to-many role-permission mapping
-- ---------------------------------------------------------------------------
CREATE TABLE sys_role_permission (
    id              BIGSERIAL       PRIMARY KEY,
    role_id         BIGINT          NOT NULL,
    permission_id   BIGINT          NOT NULL,
    CONSTRAINT uq_sys_role_permission UNIQUE (role_id, permission_id)
);

COMMENT ON TABLE  sys_role_permission IS 'Role-to-permission mapping for RBAC';
COMMENT ON COLUMN sys_role_permission.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN sys_role_permission.role_id IS 'FK to sys_role.id';
COMMENT ON COLUMN sys_role_permission.permission_id IS 'FK to sys_permission.id';

CREATE INDEX idx_sys_role_perm_role ON sys_role_permission(role_id);
CREATE INDEX idx_sys_role_perm_perm ON sys_role_permission(permission_id);

ALTER TABLE sys_role_permission
    ADD CONSTRAINT fk_sys_role_perm_role
    FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE;

ALTER TABLE sys_role_permission
    ADD CONSTRAINT fk_sys_role_perm_perm
    FOREIGN KEY (permission_id) REFERENCES sys_permission(id) ON DELETE CASCADE;
