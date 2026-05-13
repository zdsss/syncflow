-- V12: v3 feature tables — task dependencies, task templates, deliverable templates, workflow templates
-- SyncFlow v3 detailed design doc: sections 5.8, 6.5, 6.6, 6.7

-- ============================================================
-- 1. tsk_task_dependency — task dependency relationships (SS/SF/FS/FF)
-- ============================================================
CREATE TABLE IF NOT EXISTS tsk_task_dependency (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    task_id BIGINT NOT NULL,
    depends_on_task_id BIGINT NOT NULL,
    dependency_type VARCHAR(2) NOT NULL CHECK (dependency_type IN ('SS', 'SF', 'FS', 'FF')),
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_task_dependency UNIQUE (tenant_id, task_id, depends_on_task_id),
    CONSTRAINT chk_no_self_dependency CHECK (task_id <> depends_on_task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_dep_task ON tsk_task_dependency(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dep_depends ON tsk_task_dependency(depends_on_task_id);

-- ============================================================
-- 2. tsk_task_template — reusable task templates
-- ============================================================
CREATE TABLE IF NOT EXISTS tsk_task_template (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    scope VARCHAR(20) NOT NULL DEFAULT 'PERSONAL',
    creator_id BIGINT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_template_creator ON tsk_task_template(creator_id);
CREATE INDEX IF NOT EXISTS idx_task_template_scope ON tsk_task_template(tenant_id, scope);

-- ============================================================
-- 3. tsk_task_template_item — sub-task definitions within a template
-- ============================================================
CREATE TABLE IF NOT EXISTS tsk_task_template_item (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(20) DEFAULT 'TASK',
    sort_order INTEGER DEFAULT 0,
    parent_item_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_tpl_item_template ON tsk_task_template_item(template_id);

-- ============================================================
-- 4. cfg_deliverable_template — deliverable checklist templates
-- ============================================================
CREATE TABLE IF NOT EXISTS cfg_deliverable_template (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    items_json JSONB,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deliverable_tpl_tenant ON cfg_deliverable_template(tenant_id);

-- ============================================================
-- 5. wf_workflow_template — workflow templates linked to Flowable BPMN
-- ============================================================
CREATE TABLE IF NOT EXISTS wf_workflow_template (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    bpmn_process_key VARCHAR(100) NOT NULL,
    default_assignee_rule VARCHAR(50),
    config_json JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_workflow_tpl_tenant ON wf_workflow_template(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tpl_key ON wf_workflow_template(bpmn_process_key);
