-- ============================================================================
-- V17: Approval config audit log + stale approval reminder support
-- ============================================================================

-- Audit log for approval configuration changes
CREATE TABLE wf_approval_config_audit (
    id               BIGSERIAL    PRIMARY KEY,
    config_id        BIGINT       NOT NULL,
    action           VARCHAR(20)  NOT NULL,  -- CREATE, UPDATE, DELETE, ENABLE, DISABLE
    field_name       VARCHAR(100),
    old_value        TEXT,
    new_value        TEXT,
    operator_id      BIGINT       NOT NULL,
    operator_name    VARCHAR(200),
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_config_audit_config ON wf_approval_config_audit(config_id);
CREATE INDEX idx_config_audit_time   ON wf_approval_config_audit(created_at);

-- Add reminder tracking to business object for stale approval notifications
ALTER TABLE wf_business_object ADD COLUMN reminder_count   SMALLINT DEFAULT 0;
ALTER TABLE wf_business_object ADD COLUMN last_reminded_at TIMESTAMP;

-- Index for finding stale approvals efficiently
CREATE INDEX idx_bo_stale ON wf_business_object(status, applied_at) WHERE status = 2;
