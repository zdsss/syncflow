-- Audit log table for security compliance
-- V11: audit_log_table

CREATE TABLE IF NOT EXISTS biz_audit_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id BIGINT,
    detail TEXT,
    ip_address VARCHAR(50),
    tenant_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON biz_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON biz_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON biz_audit_log(created_at);
