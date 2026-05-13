-- ============================================================================
-- SyncFlow V6: Approval Config Seed Data
-- Workflow approval routing configuration and seed data
-- ============================================================================

-- ---------------------------------------------------------------------------
-- wf_approval_config: Approval routing configuration
-- Defines how approval assignees are resolved for each BPMN node.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wf_approval_config (
    id              BIGSERIAL       PRIMARY KEY,
    object_type     VARCHAR(50)     NOT NULL,
    process_key     VARCHAR(100)    NOT NULL,
    node_id         VARCHAR(100)    NOT NULL,
    node_name       VARCHAR(200),
    rule_type       VARCHAR(50)     NOT NULL,
    rule_value      VARCHAR(200),
    expression      TEXT,
    priority        INT             NOT NULL DEFAULT 100,
    skip_expression TEXT,
    required        BOOLEAN         NOT NULL DEFAULT TRUE,
    enabled         BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  wf_approval_config IS 'Approval routing configuration for BPMN nodes';
COMMENT ON COLUMN wf_approval_config.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN wf_approval_config.object_type IS 'Business object type: BOM, STAGE_GATE, PROCESS_ROUTE, MODULE_SPEC, FILE, CHANGE';
COMMENT ON COLUMN wf_approval_config.process_key IS 'Flowable process-definition key';
COMMENT ON COLUMN wf_approval_config.node_id IS 'BPMN node id within the process definition';
COMMENT ON COLUMN wf_approval_config.node_name IS 'Human-readable node display name';
COMMENT ON COLUMN wf_approval_config.rule_type IS 'Assignee resolution rule: PROJECT_ROLE, USER, DEPARTMENT, DYNAMIC';
COMMENT ON COLUMN wf_approval_config.rule_value IS 'Rule value: role code, user ids, dept id, or expression';
COMMENT ON COLUMN wf_approval_config.expression IS 'Optional SpEL / JEXL expression for dynamic resolution';
COMMENT ON COLUMN wf_approval_config.priority IS 'Lower value = higher priority when multiple configs match';
COMMENT ON COLUMN wf_approval_config.skip_expression IS 'SpEL expression that, when evaluating to true, skips this node';
COMMENT ON COLUMN wf_approval_config.required IS 'Whether this approval step is mandatory';
COMMENT ON COLUMN wf_approval_config.enabled IS 'Whether this configuration row is active';
COMMENT ON COLUMN wf_approval_config.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN wf_approval_config.updated_at IS 'Row last-update timestamp';

CREATE INDEX idx_wf_approval_config_type_key ON wf_approval_config(object_type, process_key);
CREATE INDEX idx_wf_approval_config_enabled  ON wf_approval_config(enabled);

-- ---------------------------------------------------------------------------
-- Seed data: BOM Approval
-- ---------------------------------------------------------------------------
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled) VALUES
('BOM', 'BOM_APPROVAL', 'techReview', '技术负责人审核', 'PROJECT_ROLE', 'TECH_LEADER', 10, true),
('BOM', 'BOM_APPROVAL', 'processReview', '工艺路线审核', 'PROJECT_ROLE', 'PROCESS_ENGINEER', 20, true),
('BOM', 'BOM_APPROVAL', 'qualityReview', '质量审核', 'PROJECT_ROLE', 'QUALITY_ENGINEER', 30, true),
('BOM', 'BOM_APPROVAL', 'pmApproval', '项目经理批准', 'PROJECT_ROLE', 'PROJECT_MANAGER', 40, true);

-- ---------------------------------------------------------------------------
-- Seed data: Stage Gate Approval
-- ---------------------------------------------------------------------------
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled) VALUES
('STAGE_GATE', 'STAGE_GATE_APPROVAL', 'startApproval', '启动审批', 'PROJECT_ROLE', 'PROJECT_MANAGER', 10, true),
('STAGE_GATE', 'STAGE_GATE_APPROVAL', 'finalApproval', '批准', 'PROJECT_ROLE', 'PROJECT_MANAGER', 20, true);

-- ---------------------------------------------------------------------------
-- Seed data: Process Route Approval
-- ---------------------------------------------------------------------------
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled) VALUES
('PROCESS_ROUTE', 'PROCESS_APPROVAL', 'techReview', '技术审核', 'PROJECT_ROLE', 'TECH_LEADER', 10, true),
('PROCESS_ROUTE', 'PROCESS_APPROVAL', 'processReview', '工艺审核', 'PROJECT_ROLE', 'PROCESS_ENGINEER', 20, true);

-- ---------------------------------------------------------------------------
-- Seed data: Module Spec Approval
-- ---------------------------------------------------------------------------
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled) VALUES
('MODULE_SPEC', 'MODULE_SPEC_APPROVAL', 'deptReview', '部门审核', 'DEPARTMENT', 'DEPARTMENT_HEAD', 10, true),
('MODULE_SPEC', 'MODULE_SPEC_APPROVAL', 'techReview', '技术审核', 'PROJECT_ROLE', 'TECH_LEADER', 20, true);

-- ---------------------------------------------------------------------------
-- Seed data: Change Approval
-- ---------------------------------------------------------------------------
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled) VALUES
('CHANGE', 'CHANGE_APPROVAL', 'impactReview', '影响评估', 'PROJECT_ROLE', 'TECH_LEADER', 10, true),
('CHANGE', 'CHANGE_APPROVAL', 'techReview', '技术审核', 'PROJECT_ROLE', 'TECH_LEADER', 20, true),
('CHANGE', 'CHANGE_APPROVAL', 'pmApproval', '项目经理批准', 'PROJECT_ROLE', 'PROJECT_MANAGER', 30, true);

-- ---------------------------------------------------------------------------
-- Seed data: File Approval
-- ---------------------------------------------------------------------------
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled) VALUES
('FILE', 'FILE_APPROVAL', 'review', '文件审核', 'PROJECT_ROLE', 'PROJECT_MANAGER', 10, true);
