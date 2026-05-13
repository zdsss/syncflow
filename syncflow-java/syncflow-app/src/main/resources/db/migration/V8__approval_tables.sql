-- ============================================================================
-- V8: Approval workflow tables + new approval config seed data
-- ============================================================================

-- Generic business-object ↔ Flowable binding
CREATE TABLE wf_business_object (
    id                   BIGSERIAL    PRIMARY KEY,
    object_type          VARCHAR(50)  NOT NULL,
    object_id            BIGINT       NOT NULL,
    object_name          VARCHAR(500),
    object_code          VARCHAR(100),
    project_id           BIGINT,
    status               SMALLINT     NOT NULL DEFAULT 2,
    current_node         VARCHAR(200),
    current_task_id      VARCHAR(64),
    flow_definition_id   VARCHAR(100),
    flow_definition_key  VARCHAR(100),
    flow_version         INT,
    flow_instance_id     VARCHAR(64),
    applicant_id         BIGINT       NOT NULL,
    applied_at           TIMESTAMP,
    completed_at         TIMESTAMP,
    completed_by         BIGINT,
    tenant_id            BIGINT       DEFAULT 1,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bo_flow_instance ON wf_business_object(flow_instance_id);
CREATE INDEX idx_bo_current_task  ON wf_business_object(current_task_id);
CREATE INDEX idx_bo_object_type_id ON wf_business_object(object_type, object_id);

-- Approval delegation (per-task and global)
CREATE TABLE wf_delegation (
    id                 BIGSERIAL    PRIMARY KEY,
    business_object_id BIGINT,
    from_user_id       BIGINT       NOT NULL,
    to_user_id         BIGINT       NOT NULL,
    delegation_type    VARCHAR(20)  NOT NULL DEFAULT 'SINGLE',
    reason             TEXT,
    start_time         TIMESTAMP    NOT NULL,
    end_time           TIMESTAMP,
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_delegation_from_active ON wf_delegation(from_user_id, is_active);

-- Carbon-copy records
CREATE TABLE wf_cc_record (
    id                 BIGSERIAL    PRIMARY KEY,
    business_object_id BIGINT       NOT NULL,
    user_id            BIGINT       NOT NULL,
    is_read            BOOLEAN      NOT NULL DEFAULT FALSE,
    read_at            TIMESTAMP,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cc_user          ON wf_cc_record(user_id);
CREATE INDEX idx_cc_business_object ON wf_cc_record(business_object_id);

-- Approval action history
CREATE TABLE wf_approval_comment (
    id                 BIGSERIAL    PRIMARY KEY,
    business_object_id BIGINT       NOT NULL,
    task_id            VARCHAR(64),
    node_name          VARCHAR(200),
    approver_id        BIGINT,
    approver_name      VARCHAR(200),
    action             VARCHAR(20)  NOT NULL,
    comment            TEXT,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ac_business_object ON wf_approval_comment(business_object_id);

-- Change requests (BOM / process-route / module-spec changes)
CREATE TABLE wf_change_request (
    id               BIGSERIAL    PRIMARY KEY,
    object_type      VARCHAR(50)  NOT NULL,
    object_id        BIGINT       NOT NULL,
    change_type      VARCHAR(30)  NOT NULL,
    change_data      JSONB        NOT NULL,
    change_summary   TEXT,
    status           SMALLINT     NOT NULL DEFAULT 1,
    flow_instance_id VARCHAR(64),
    requested_by     BIGINT       NOT NULL,
    requested_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at      TIMESTAMP,
    resolved_by      BIGINT,
    tenant_id        BIGINT       DEFAULT 1,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cr_object ON wf_change_request(object_type, object_id);
CREATE INDEX idx_cr_status ON wf_change_request(status);

-- Add publish metadata to fil_file
ALTER TABLE fil_file ADD COLUMN published_at TIMESTAMP;
ALTER TABLE fil_file ADD COLUMN published_by BIGINT;

-- Add flow instance link to prj_project
ALTER TABLE prj_project ADD COLUMN flow_instance_id VARCHAR(64);

-- ============================================================================
-- Seed: approval configs for new object types
-- ============================================================================

-- Milestone (single-node generic)
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES ('MILESTONE', 'GENERIC_APPROVAL', 'approval', '项目经理批准', 'PROJECT_ROLE', 'PROJECT_MANAGER', 10, true);

-- Issue closure
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES ('ISSUE', 'GENERIC_APPROVAL', 'approval', '技术审核', 'PROJECT_ROLE', 'TECH_LEADER', 10, true);

-- Risk closure
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES ('RISK', 'GENERIC_APPROVAL', 'approval', '风险确认', 'PROJECT_ROLE', 'PROJECT_MANAGER', 10, true);

-- Project creation
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES ('PROJECT', 'GENERIC_APPROVAL', 'approval', '部门负责人审批', 'DEPARTMENT', 'APPLICANT_DEPT', 10, true);

-- BOM change (3-step)
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES
('BOM_CHANGE', 'CHANGE_APPROVAL', 'impactReview', '影响评估', 'PROJECT_ROLE', 'PROCESS_ENGINEER', 10, true),
('BOM_CHANGE', 'CHANGE_APPROVAL', 'techReview',   '技术审核', 'PROJECT_ROLE', 'TECH_LEADER',     20, true),
('BOM_CHANGE', 'CHANGE_APPROVAL', 'pmApproval',   '项目经理批准', 'PROJECT_ROLE', 'PROJECT_MANAGER', 30, true);

-- Process route change (3-step)
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES
('PROCESS_CHANGE', 'CHANGE_APPROVAL', 'impactReview', '影响评估', 'PROJECT_ROLE', 'QUALITY_ENGINEER',  10, true),
('PROCESS_CHANGE', 'CHANGE_APPROVAL', 'techReview',   '技术审核', 'PROJECT_ROLE', 'PROCESS_ENGINEER',  20, true),
('PROCESS_CHANGE', 'CHANGE_APPROVAL', 'pmApproval',   '项目经理批准', 'PROJECT_ROLE', 'PROJECT_MANAGER',   30, true);

-- Module spec change (3-step)
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES
('SPEC_CHANGE', 'CHANGE_APPROVAL', 'impactReview', '影响评估', 'DEPARTMENT', 'APPLICANT_DEPT', 10, true),
('SPEC_CHANGE', 'CHANGE_APPROVAL', 'techReview',   '技术审核', 'USER',       '1',              20, true),
('SPEC_CHANGE', 'CHANGE_APPROVAL', 'pmApproval',   '批准',     'USER',       '1',              30, true);

-- File publish (by biz_type)
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES
('FILE_BOM',      'FILE_APPROVAL', 'review', '文件审核', 'PROJECT_ROLE', 'TECH_LEADER',      10, true),
('FILE_PROCESS',  'FILE_APPROVAL', 'review', '文件审核', 'PROJECT_ROLE', 'PROCESS_ENGINEER', 10, true),
('FILE_DOCUMENT', 'FILE_APPROVAL', 'review', '文件审核', 'PROJECT_ROLE', 'PROJECT_MANAGER',  10, true);
