-- ============================================================================
-- SyncFlow V1 Init Schema
-- Industrial Project Management System - PostgreSQL Migration
-- Created: 2026-05-06
-- ============================================================================

-- ============================================================================
-- 1. SYSTEM TABLES (sys_*)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- sys_department: Organisational department tree (created first for FK refs)
-- ---------------------------------------------------------------------------
CREATE TABLE sys_department (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    code            VARCHAR(50)     NOT NULL UNIQUE,
    parent_id       BIGINT,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  sys_department IS 'Organisational department hierarchy';
COMMENT ON COLUMN sys_department.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN sys_department.name IS 'Department display name';
COMMENT ON COLUMN sys_department.code IS 'Unique department code for programmatic reference';
COMMENT ON COLUMN sys_department.parent_id IS 'FK to sys_department.id, NULL for root departments';
COMMENT ON COLUMN sys_department.sort_order IS 'Display sort order among siblings';
COMMENT ON COLUMN sys_department.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN sys_department.deleted_at IS 'Soft-delete timestamp, NULL means not deleted';

CREATE INDEX idx_sys_dept_parent ON sys_department(parent_id);

-- Self-referencing FK
ALTER TABLE sys_department
    ADD CONSTRAINT fk_sys_dept_parent
    FOREIGN KEY (parent_id) REFERENCES sys_department(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- sys_user: System user accounts
-- ---------------------------------------------------------------------------
CREATE TABLE sys_user (
    id              BIGSERIAL       PRIMARY KEY,
    username        VARCHAR(50)     NOT NULL UNIQUE,
    password        VARCHAR(255)    NOT NULL,
    real_name       VARCHAR(100),
    phone           VARCHAR(20),
    email           VARCHAR(100),
    avatar          VARCHAR(500),
    status          SMALLINT        NOT NULL DEFAULT 1,
    tenant_id       BIGINT          NOT NULL DEFAULT 1,
    dept_id         BIGINT,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  sys_user IS 'System user accounts';
COMMENT ON COLUMN sys_user.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN sys_user.username IS 'Login username, unique';
COMMENT ON COLUMN sys_user.password IS 'BCrypt hashed password';
COMMENT ON COLUMN sys_user.real_name IS 'Display name in Chinese / native language';
COMMENT ON COLUMN sys_user.phone IS 'Mobile phone number';
COMMENT ON COLUMN sys_user.email IS 'Email address';
COMMENT ON COLUMN sys_user.avatar IS 'Avatar image URL or object storage path';
COMMENT ON COLUMN sys_user.status IS 'Account status: 1=active, 0=inactive, -1=locked';
COMMENT ON COLUMN sys_user.tenant_id IS 'Tenant identifier for multi-tenancy, default 1';
COMMENT ON COLUMN sys_user.dept_id IS 'FK to sys_department.id';
COMMENT ON COLUMN sys_user.last_login_at IS 'Timestamp of last successful login';
COMMENT ON COLUMN sys_user.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN sys_user.updated_at IS 'Row last-update timestamp';
COMMENT ON COLUMN sys_user.deleted_at IS 'Soft-delete timestamp, NULL means not deleted';

CREATE INDEX idx_sys_user_tenant ON sys_user(tenant_id);
CREATE INDEX idx_sys_user_dept   ON sys_user(dept_id);
CREATE INDEX idx_sys_user_status ON sys_user(status);
CREATE INDEX idx_sys_user_email  ON sys_user(email);

ALTER TABLE sys_user
    ADD CONSTRAINT fk_sys_user_dept
    FOREIGN KEY (dept_id) REFERENCES sys_department(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- sys_role: Role definitions (RBAC)
-- ---------------------------------------------------------------------------
CREATE TABLE sys_role (
    id              BIGSERIAL       PRIMARY KEY,
    code            VARCHAR(50)     NOT NULL UNIQUE,
    name            VARCHAR(100)    NOT NULL,
    description     VARCHAR(500),
    tenant_id       BIGINT          NOT NULL DEFAULT 1
);

COMMENT ON TABLE  sys_role IS 'Role definitions for RBAC';
COMMENT ON COLUMN sys_role.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN sys_role.code IS 'Unique role code, e.g. ADMIN, PM, ENGINEER';
COMMENT ON COLUMN sys_role.name IS 'Human-readable role name';
COMMENT ON COLUMN sys_role.description IS 'Role description and responsibilities';
COMMENT ON COLUMN sys_role.tenant_id IS 'Tenant identifier for multi-tenancy';

CREATE INDEX idx_sys_role_tenant ON sys_role(tenant_id);

-- ---------------------------------------------------------------------------
-- sys_user_role: Many-to-many user-role mapping with optional scope
-- ---------------------------------------------------------------------------
CREATE TABLE sys_user_role (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    role_id         BIGINT          NOT NULL,
    scope_type      VARCHAR(20),
    scope_id        BIGINT,
    CONSTRAINT uq_sys_user_role UNIQUE (user_id, role_id, scope_type, scope_id)
);

COMMENT ON TABLE  sys_user_role IS 'User-to-role mapping with optional scope constraint';
COMMENT ON COLUMN sys_user_role.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN sys_user_role.user_id IS 'FK to sys_user.id';
COMMENT ON COLUMN sys_user_role.role_id IS 'FK to sys_role.id';
COMMENT ON COLUMN sys_user_role.scope_type IS 'Scope qualifier: GLOBAL, DEPT, or PROJECT';
COMMENT ON COLUMN sys_user_role.scope_id IS 'Target entity id for DEPT or PROJECT scope, NULL for GLOBAL';

CREATE INDEX idx_sys_user_role_user ON sys_user_role(user_id);
CREATE INDEX idx_sys_user_role_role ON sys_user_role(role_id);

ALTER TABLE sys_user_role
    ADD CONSTRAINT fk_sys_user_role_user
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE;

ALTER TABLE sys_user_role
    ADD CONSTRAINT fk_sys_user_role_role
    FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- sys_permission: Permission definitions (menu / button / API)
-- ---------------------------------------------------------------------------
CREATE TABLE sys_permission (
    id              BIGSERIAL       PRIMARY KEY,
    code            VARCHAR(100)    NOT NULL UNIQUE,
    name            VARCHAR(100)    NOT NULL,
    type            VARCHAR(20)     NOT NULL,
    parent_id       BIGINT,
    path            VARCHAR(200),
    icon            VARCHAR(50),
    sort_order      INT             NOT NULL DEFAULT 0
);

COMMENT ON TABLE  sys_permission IS 'Permission / menu / button definitions for RBAC';
COMMENT ON COLUMN sys_permission.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN sys_permission.code IS 'Unique permission code, e.g. project:create';
COMMENT ON COLUMN sys_permission.name IS 'Display name shown in admin UI';
COMMENT ON COLUMN sys_permission.type IS 'Permission type: MENU, BUTTON, or API';
COMMENT ON COLUMN sys_permission.parent_id IS 'FK to sys_permission.id, tree structure';
COMMENT ON COLUMN sys_permission.path IS 'Frontend route path or API path pattern';
COMMENT ON COLUMN sys_permission.icon IS 'Icon identifier for menu items';
COMMENT ON COLUMN sys_permission.sort_order IS 'Display sort order among siblings';

CREATE INDEX idx_sys_perm_parent ON sys_permission(parent_id);

ALTER TABLE sys_permission
    ADD CONSTRAINT fk_sys_perm_parent
    FOREIGN KEY (parent_id) REFERENCES sys_permission(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. PROJECT TABLES (prj_*)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- prj_project: Top-level project entity
-- ---------------------------------------------------------------------------
CREATE TABLE prj_project (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(200)    NOT NULL,
    code            VARCHAR(50)     NOT NULL UNIQUE,
    description     TEXT,
    owner_id        BIGINT          NOT NULL,
    project_type    VARCHAR(50),
    status          SMALLINT        NOT NULL DEFAULT 1,
    priority        SMALLINT        NOT NULL DEFAULT 2,
    progress        INT             NOT NULL DEFAULT 0,
    planned_start   DATE,
    planned_end     DATE,
    actual_start    DATE,
    actual_end      DATE,
    parent_id       BIGINT,
    parent_path     VARCHAR(500),
    dept_id         BIGINT,
    tenant_id       BIGINT          NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  prj_project IS 'Core project entity for industrial project management';
COMMENT ON COLUMN prj_project.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN prj_project.name IS 'Project display name';
COMMENT ON COLUMN prj_project.code IS 'Unique project code for programmatic reference';
COMMENT ON COLUMN prj_project.description IS 'Rich-text project description';
COMMENT ON COLUMN prj_project.owner_id IS 'FK to sys_user.id, project owner / manager';
COMMENT ON COLUMN prj_project.project_type IS 'Project classification: R&D, PRODUCTION, MAINTENANCE, etc.';
COMMENT ON COLUMN prj_project.status IS '1=not_started, 2=in_progress, 3=completed, 4=delayed, 0=cancelled';
COMMENT ON COLUMN prj_project.priority IS '1=urgent, 2=high, 3=medium, 4=low';
COMMENT ON COLUMN prj_project.progress IS 'Completion percentage 0-100';
COMMENT ON COLUMN prj_project.planned_start IS 'Planned project start date';
COMMENT ON COLUMN prj_project.planned_end IS 'Planned project end date';
COMMENT ON COLUMN prj_project.actual_start IS 'Actual project start date';
COMMENT ON COLUMN prj_project.actual_end IS 'Actual project end date';
COMMENT ON COLUMN prj_project.parent_id IS 'FK to prj_project.id for sub-projects';
COMMENT ON COLUMN prj_project.parent_path IS 'Materialised ancestor path for fast tree queries';
COMMENT ON COLUMN prj_project.dept_id IS 'FK to sys_department.id, owning department';
COMMENT ON COLUMN prj_project.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN prj_project.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN prj_project.updated_at IS 'Row last-update timestamp';
COMMENT ON COLUMN prj_project.deleted_at IS 'Soft-delete timestamp, NULL means not deleted';

CREATE INDEX idx_prj_project_owner   ON prj_project(owner_id);
CREATE INDEX idx_prj_project_parent  ON prj_project(parent_id);
CREATE INDEX idx_prj_project_dept    ON prj_project(dept_id);
CREATE INDEX idx_prj_project_tenant  ON prj_project(tenant_id);
CREATE INDEX idx_prj_project_status  ON prj_project(status);
CREATE INDEX idx_prj_project_type    ON prj_project(project_type);

ALTER TABLE prj_project
    ADD CONSTRAINT fk_prj_project_owner
    FOREIGN KEY (owner_id) REFERENCES sys_user(id);

ALTER TABLE prj_project
    ADD CONSTRAINT fk_prj_project_parent
    FOREIGN KEY (parent_id) REFERENCES prj_project(id) ON DELETE SET NULL;

ALTER TABLE prj_project
    ADD CONSTRAINT fk_prj_project_dept
    FOREIGN KEY (dept_id) REFERENCES sys_department(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- prj_phase: Project phases / stages
-- ---------------------------------------------------------------------------
CREATE TABLE prj_phase (
    id              BIGSERIAL       PRIMARY KEY,
    project_id      BIGINT          NOT NULL,
    name            VARCHAR(100)    NOT NULL,
    code            VARCHAR(50),
    seq_no          INT             NOT NULL,
    status          SMALLINT        NOT NULL DEFAULT 1,
    progress        INT             NOT NULL DEFAULT 0,
    planned_start   DATE,
    planned_end     DATE,
    actual_start    DATE,
    actual_end      DATE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  prj_phase IS 'Project phases / stages within a project lifecycle';
COMMENT ON COLUMN prj_phase.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN prj_phase.project_id IS 'FK to prj_project.id';
COMMENT ON COLUMN prj_phase.name IS 'Phase display name, e.g. CONCEPT, DESIGN, TESTING';
COMMENT ON COLUMN prj_phase.code IS 'Phase code for programmatic reference';
COMMENT ON COLUMN prj_phase.seq_no IS 'Sequence number for ordering phases';
COMMENT ON COLUMN prj_phase.status IS '1=not_started, 2=in_progress, 3=completed';
COMMENT ON COLUMN prj_phase.progress IS 'Completion percentage 0-100';
COMMENT ON COLUMN prj_phase.planned_start IS 'Planned phase start date';
COMMENT ON COLUMN prj_phase.planned_end IS 'Planned phase end date';
COMMENT ON COLUMN prj_phase.actual_start IS 'Actual phase start date';
COMMENT ON COLUMN prj_phase.actual_end IS 'Actual phase end date';
COMMENT ON COLUMN prj_phase.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN prj_phase.updated_at IS 'Row last-update timestamp';

CREATE INDEX idx_prj_phase_project ON prj_phase(project_id);

ALTER TABLE prj_phase
    ADD CONSTRAINT fk_prj_phase_project
    FOREIGN KEY (project_id) REFERENCES prj_project(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- prj_stage_gate: Gate reviews between project phases
-- ---------------------------------------------------------------------------
CREATE TABLE prj_stage_gate (
    id               BIGSERIAL       PRIMARY KEY,
    phase_id         BIGINT          NOT NULL,
    name             VARCHAR(100)    NOT NULL,
    gate_type        VARCHAR(50)     NOT NULL,
    status           SMALLINT        NOT NULL DEFAULT 1,
    flow_instance_id VARCHAR(100),
    task_id          VARCHAR(100),
    approver_id      BIGINT,
    approved_at      TIMESTAMP,
    comments         TEXT,
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  prj_stage_gate IS 'Gate reviews (DQR, TR, QG) between project phases';
COMMENT ON COLUMN prj_stage_gate.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN prj_stage_gate.phase_id IS 'FK to prj_phase.id';
COMMENT ON COLUMN prj_stage_gate.name IS 'Gate display name';
COMMENT ON COLUMN prj_stage_gate.gate_type IS 'Gate type code: DQR, TR, QG, etc.';
COMMENT ON COLUMN prj_stage_gate.status IS '1=pending, 2=approved, 3=rejected';
COMMENT ON COLUMN prj_stage_gate.flow_instance_id IS 'Workflow engine instance identifier';
COMMENT ON COLUMN prj_stage_gate.task_id IS 'Workflow task identifier';
COMMENT ON COLUMN prj_stage_gate.approver_id IS 'FK to sys_user.id who approved/rejected';
COMMENT ON COLUMN prj_stage_gate.approved_at IS 'Timestamp when gate was approved or rejected';
COMMENT ON COLUMN prj_stage_gate.comments IS 'Reviewer comments';
COMMENT ON COLUMN prj_stage_gate.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN prj_stage_gate.updated_at IS 'Row last-update timestamp';

CREATE INDEX idx_prj_stage_gate_phase ON prj_stage_gate(phase_id);

ALTER TABLE prj_stage_gate
    ADD CONSTRAINT fk_prj_stage_gate_phase
    FOREIGN KEY (phase_id) REFERENCES prj_phase(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- prj_milestone: Project and phase milestones
-- ---------------------------------------------------------------------------
CREATE TABLE prj_milestone (
    id                  BIGSERIAL       PRIMARY KEY,
    project_id          BIGINT          NOT NULL,
    phase_id            BIGINT,
    name                VARCHAR(100)    NOT NULL,
    type                VARCHAR(30)     NOT NULL DEFAULT 'MILESTONE',
    status              SMALLINT        NOT NULL DEFAULT 1,
    progress            INT             NOT NULL DEFAULT 0,
    planned_date        DATE,
    actual_date         DATE,
    assignee_id         BIGINT,
    deliverable         TEXT,
    parent_milestone_id BIGINT,
    flow_instance_id    VARCHAR(100),
    task_id             VARCHAR(100),
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  prj_milestone IS 'Milestones, deliverables, and review points within projects';
COMMENT ON COLUMN prj_milestone.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN prj_milestone.project_id IS 'FK to prj_project.id';
COMMENT ON COLUMN prj_milestone.phase_id IS 'FK to prj_phase.id, NULL if cross-phase';
COMMENT ON COLUMN prj_milestone.name IS 'Milestone display name';
COMMENT ON COLUMN prj_milestone.type IS 'Type: MILESTONE, DELIVERABLE, or REVIEW';
COMMENT ON COLUMN prj_milestone.status IS '1=not_started, 2=in_progress, 3=completed, 4=delayed';
COMMENT ON COLUMN prj_milestone.progress IS 'Completion percentage 0-100';
COMMENT ON COLUMN prj_milestone.planned_date IS 'Target completion date';
COMMENT ON COLUMN prj_milestone.actual_date IS 'Actual completion date';
COMMENT ON COLUMN prj_milestone.assignee_id IS 'FK to sys_user.id, responsible person';
COMMENT ON COLUMN prj_milestone.deliverable IS 'Description of the deliverable or acceptance criteria';
COMMENT ON COLUMN prj_milestone.parent_milestone_id IS 'FK to prj_milestone.id for hierarchical milestones';
COMMENT ON COLUMN prj_milestone.flow_instance_id IS 'Workflow engine instance identifier';
COMMENT ON COLUMN prj_milestone.task_id IS 'Workflow task identifier';
COMMENT ON COLUMN prj_milestone.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN prj_milestone.updated_at IS 'Row last-update timestamp';

CREATE INDEX idx_prj_milestone_project ON prj_milestone(project_id);
CREATE INDEX idx_prj_milestone_phase   ON prj_milestone(phase_id);

ALTER TABLE prj_milestone
    ADD CONSTRAINT fk_prj_milestone_project
    FOREIGN KEY (project_id) REFERENCES prj_project(id) ON DELETE CASCADE;

ALTER TABLE prj_milestone
    ADD CONSTRAINT fk_prj_milestone_phase
    FOREIGN KEY (phase_id) REFERENCES prj_phase(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- prj_project_member: Project team membership
-- ---------------------------------------------------------------------------
CREATE TABLE prj_project_member (
    id              BIGSERIAL       PRIMARY KEY,
    project_id      BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    project_role    VARCHAR(50),
    dept_id         BIGINT,
    joined_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_prj_member UNIQUE (project_id, user_id)
);

COMMENT ON TABLE  prj_project_member IS 'Project team membership, maps users to projects with roles';
COMMENT ON COLUMN prj_project_member.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN prj_project_member.project_id IS 'FK to prj_project.id';
COMMENT ON COLUMN prj_project_member.user_id IS 'FK to sys_user.id';
COMMENT ON COLUMN prj_project_member.project_role IS 'Role within the project: PM, ENGINEER, TESTER, OBSERVER';
COMMENT ON COLUMN prj_project_member.dept_id IS 'FK to sys_department.id, member department at join time';
COMMENT ON COLUMN prj_project_member.joined_at IS 'Timestamp when user joined the project';

CREATE INDEX idx_prj_member_user ON prj_project_member(user_id);

ALTER TABLE prj_project_member
    ADD CONSTRAINT fk_prj_member_project
    FOREIGN KEY (project_id) REFERENCES prj_project(id) ON DELETE CASCADE;

ALTER TABLE prj_project_member
    ADD CONSTRAINT fk_prj_member_user
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE;

-- ============================================================================
-- 3. TASK TABLES (tsk_*)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- tsk_task: Core task / work-item entity
-- ---------------------------------------------------------------------------
CREATE TABLE tsk_task (
    id                  BIGSERIAL       PRIMARY KEY,
    task_no             VARCHAR(50)     NOT NULL UNIQUE,
    title               VARCHAR(200)    NOT NULL,
    description         TEXT,
    type                VARCHAR(30)     NOT NULL,
    project_id          BIGINT,
    phase_id            BIGINT,
    milestone_id        BIGINT,
    parent_id           BIGINT,
    parent_path         VARCHAR(500),
    status              SMALLINT        NOT NULL DEFAULT 1,
    progress            INT             NOT NULL DEFAULT 0,
    assignee_id         BIGINT,
    reporter_id         BIGINT,
    planned_start       DATE,
    planned_end         DATE,
    planned_hours       DECIMAL(10,2),
    planned_days        INT,
    actual_start        DATE,
    actual_end          DATE,
    actual_hours        DECIMAL(10,2),
    due_date            DATE,
    is_overdue          BOOLEAN         NOT NULL DEFAULT FALSE,
    is_warning          BOOLEAN         NOT NULL DEFAULT FALSE,
    tags                VARCHAR(500),
    task_category       VARCHAR(50),
    flow_instance_id    VARCHAR(100),
    task_id_in_flow     VARCHAR(100),
    comment_count       INT             NOT NULL DEFAULT 0,
    attachment_count    INT             NOT NULL DEFAULT 0,
    watcher_count       INT             NOT NULL DEFAULT 0,
    tenant_id           BIGINT          NOT NULL DEFAULT 1,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP
);

COMMENT ON TABLE  tsk_task IS 'Core task / work-item entity for project execution';
COMMENT ON COLUMN tsk_task.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN tsk_task.task_no IS 'Auto-generated human-readable task number, e.g. TSK-20260506-0001';
COMMENT ON COLUMN tsk_task.title IS 'Task title / summary';
COMMENT ON COLUMN tsk_task.description IS 'Detailed task description (rich text)';
COMMENT ON COLUMN tsk_task.type IS 'Task type: DESIGN, DEVELOP, TEST, REVIEW, DELIVERABLE, etc.';
COMMENT ON COLUMN tsk_task.project_id IS 'FK to prj_project.id';
COMMENT ON COLUMN tsk_task.phase_id IS 'FK to prj_phase.id';
COMMENT ON COLUMN tsk_task.milestone_id IS 'FK to prj_milestone.id';
COMMENT ON COLUMN tsk_task.parent_id IS 'FK to tsk_task.id for sub-task hierarchy';
COMMENT ON COLUMN tsk_task.parent_path IS 'Materialised ancestor path for fast tree queries';
COMMENT ON COLUMN tsk_task.status IS '1=not_started, 2=in_progress, 3=on_hold, 4=completed, 5=overdue, 6=cancelled';
COMMENT ON COLUMN tsk_task.progress IS 'Completion percentage 0-100';
COMMENT ON COLUMN tsk_task.assignee_id IS 'FK to sys_user.id, primary assignee';
COMMENT ON COLUMN tsk_task.reporter_id IS 'FK to sys_user.id, task creator / reporter';
COMMENT ON COLUMN tsk_task.planned_start IS 'Planned start date';
COMMENT ON COLUMN tsk_task.planned_end IS 'Planned end date';
COMMENT ON COLUMN tsk_task.planned_hours IS 'Estimated hours for the task';
COMMENT ON COLUMN tsk_task.planned_days IS 'Estimated working days';
COMMENT ON COLUMN tsk_task.actual_start IS 'Actual start date';
COMMENT ON COLUMN tsk_task.actual_end IS 'Actual end date';
COMMENT ON COLUMN tsk_task.actual_hours IS 'Actual hours spent';
COMMENT ON COLUMN tsk_task.due_date IS 'Hard deadline for the task';
COMMENT ON COLUMN tsk_task.is_overdue IS 'True if task has passed its due_date without completion';
COMMENT ON COLUMN tsk_task.is_warning IS 'True if task is approaching due_date threshold';
COMMENT ON COLUMN tsk_task.tags IS 'Comma-separated tags for categorisation and filtering';
COMMENT ON COLUMN tsk_task.task_category IS 'Sub-category within task type';
COMMENT ON COLUMN tsk_task.flow_instance_id IS 'Workflow engine instance identifier';
COMMENT ON COLUMN tsk_task.task_id_in_flow IS 'Workflow task identifier within the flow instance';
COMMENT ON COLUMN tsk_task.comment_count IS 'Denormalised comment count for list queries';
COMMENT ON COLUMN tsk_task.attachment_count IS 'Denormalised attachment count for list queries';
COMMENT ON COLUMN tsk_task.watcher_count IS 'Denormalised watcher count for list queries';
COMMENT ON COLUMN tsk_task.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN tsk_task.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN tsk_task.updated_at IS 'Row last-update timestamp';
COMMENT ON COLUMN tsk_task.deleted_at IS 'Soft-delete timestamp, NULL means not deleted';

CREATE INDEX idx_tsk_task_type       ON tsk_task(type);
CREATE INDEX idx_tsk_task_project    ON tsk_task(project_id);
CREATE INDEX idx_tsk_task_assignee   ON tsk_task(assignee_id);
CREATE INDEX idx_tsk_task_status     ON tsk_task(status);
CREATE INDEX idx_tsk_task_due_date   ON tsk_task(due_date);
CREATE INDEX idx_tsk_task_overdue    ON tsk_task(is_overdue);
CREATE INDEX idx_tsk_task_reporter   ON tsk_task(reporter_id);
CREATE INDEX idx_tsk_task_parent     ON tsk_task(parent_id);
CREATE INDEX idx_tsk_task_phase      ON tsk_task(phase_id);
CREATE INDEX idx_tsk_task_milestone  ON tsk_task(milestone_id);
CREATE INDEX idx_tsk_task_tenant     ON tsk_task(tenant_id);

ALTER TABLE tsk_task
    ADD CONSTRAINT fk_tsk_task_project
    FOREIGN KEY (project_id) REFERENCES prj_project(id) ON DELETE SET NULL;

ALTER TABLE tsk_task
    ADD CONSTRAINT fk_tsk_task_phase
    FOREIGN KEY (phase_id) REFERENCES prj_phase(id) ON DELETE SET NULL;

ALTER TABLE tsk_task
    ADD CONSTRAINT fk_tsk_task_milestone
    FOREIGN KEY (milestone_id) REFERENCES prj_milestone(id) ON DELETE SET NULL;

ALTER TABLE tsk_task
    ADD CONSTRAINT fk_tsk_task_parent
    FOREIGN KEY (parent_id) REFERENCES tsk_task(id) ON DELETE SET NULL;

ALTER TABLE tsk_task
    ADD CONSTRAINT fk_tsk_task_assignee
    FOREIGN KEY (assignee_id) REFERENCES sys_user(id) ON DELETE SET NULL;

ALTER TABLE tsk_task
    ADD CONSTRAINT fk_tsk_task_reporter
    FOREIGN KEY (reporter_id) REFERENCES sys_user(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- tsk_task_participant: Task participants (collaborators, reviewers)
-- ---------------------------------------------------------------------------
CREATE TABLE tsk_task_participant (
    id              BIGSERIAL       PRIMARY KEY,
    task_id         BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    role            VARCHAR(20),    -- COLLABORATOR, REVIEWER, APPROVER
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tsk_participant UNIQUE (task_id, user_id)
);

COMMENT ON TABLE  tsk_task_participant IS 'Task participants beyond the primary assignee';
COMMENT ON COLUMN tsk_task_participant.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN tsk_task_participant.task_id IS 'FK to tsk_task.id';
COMMENT ON COLUMN tsk_task_participant.user_id IS 'FK to sys_user.id';
COMMENT ON COLUMN tsk_task_participant.role IS 'Participant role: COLLABORATOR, REVIEWER, APPROVER';
COMMENT ON COLUMN tsk_task_participant.created_at IS 'Row creation timestamp';

CREATE INDEX idx_tsk_participant_user ON tsk_task_participant(user_id);

ALTER TABLE tsk_task_participant
    ADD CONSTRAINT fk_tsk_participant_task
    FOREIGN KEY (task_id) REFERENCES tsk_task(id) ON DELETE CASCADE;

ALTER TABLE tsk_task_participant
    ADD CONSTRAINT fk_tsk_participant_user
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- tsk_task_watcher: Users watching a task for notifications
-- ---------------------------------------------------------------------------
CREATE TABLE tsk_task_watcher (
    id              BIGSERIAL       PRIMARY KEY,
    task_id         BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tsk_watcher UNIQUE (task_id, user_id)
);

COMMENT ON TABLE  tsk_task_watcher IS 'Users subscribed to task change notifications';
COMMENT ON COLUMN tsk_task_watcher.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN tsk_task_watcher.task_id IS 'FK to tsk_task.id';
COMMENT ON COLUMN tsk_task_watcher.user_id IS 'FK to sys_user.id';
COMMENT ON COLUMN tsk_task_watcher.created_at IS 'Row creation timestamp';

CREATE INDEX idx_tsk_watcher_user ON tsk_task_watcher(user_id);

ALTER TABLE tsk_task_watcher
    ADD CONSTRAINT fk_tsk_watcher_task
    FOREIGN KEY (task_id) REFERENCES tsk_task(id) ON DELETE CASCADE;

ALTER TABLE tsk_task_watcher
    ADD CONSTRAINT fk_tsk_watcher_user
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- tsk_task_comment: Comments / discussions on tasks
-- ---------------------------------------------------------------------------
CREATE TABLE tsk_task_comment (
    id              BIGSERIAL       PRIMARY KEY,
    task_id         BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    content         TEXT            NOT NULL,
    mentioned_users VARCHAR(500),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  tsk_task_comment IS 'Comments and discussions attached to tasks';
COMMENT ON COLUMN tsk_task_comment.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN tsk_task_comment.task_id IS 'FK to tsk_task.id';
COMMENT ON COLUMN tsk_task_comment.user_id IS 'FK to sys_user.id, comment author';
COMMENT ON COLUMN tsk_task_comment.content IS 'Comment body (rich text or markdown)';
COMMENT ON COLUMN tsk_task_comment.mentioned_users IS 'Comma-separated user IDs mentioned in the comment';
COMMENT ON COLUMN tsk_task_comment.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN tsk_task_comment.updated_at IS 'Row last-update timestamp';

CREATE INDEX idx_tsk_comment_task ON tsk_task_comment(task_id);
CREATE INDEX idx_tsk_comment_user ON tsk_task_comment(user_id);

ALTER TABLE tsk_task_comment
    ADD CONSTRAINT fk_tsk_comment_task
    FOREIGN KEY (task_id) REFERENCES tsk_task(id) ON DELETE CASCADE;

ALTER TABLE tsk_task_comment
    ADD CONSTRAINT fk_tsk_comment_user
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- tsk_task_activity: Audit trail of task changes
-- ---------------------------------------------------------------------------
CREATE TABLE tsk_task_activity (
    id              BIGSERIAL       PRIMARY KEY,
    task_id         BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    action          VARCHAR(30)     NOT NULL,
    field_name      VARCHAR(50),
    old_value       TEXT,
    new_value       TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  tsk_task_activity IS 'Audit trail of all changes made to tasks';
COMMENT ON COLUMN tsk_task_activity.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN tsk_task_activity.task_id IS 'FK to tsk_task.id';
COMMENT ON COLUMN tsk_task_activity.user_id IS 'FK to sys_user.id, user who made the change';
COMMENT ON COLUMN tsk_task_activity.action IS 'Action type: CREATED, UPDATED, STATUS_CHANGED, ASSIGNED, COMMENTED, etc.';
COMMENT ON COLUMN tsk_task_activity.field_name IS 'Name of the field that was changed, NULL for non-field actions';
COMMENT ON COLUMN tsk_task_activity.old_value IS 'Previous value of the changed field';
COMMENT ON COLUMN tsk_task_activity.new_value IS 'New value of the changed field';
COMMENT ON COLUMN tsk_task_activity.created_at IS 'Row creation timestamp';

CREATE INDEX idx_tsk_activity_task ON tsk_task_activity(task_id);
CREATE INDEX idx_tsk_activity_user ON tsk_task_activity(user_id);
CREATE INDEX idx_tsk_activity_action ON tsk_task_activity(action);

ALTER TABLE tsk_task_activity
    ADD CONSTRAINT fk_tsk_activity_task
    FOREIGN KEY (task_id) REFERENCES tsk_task(id) ON DELETE CASCADE;

ALTER TABLE tsk_task_activity
    ADD CONSTRAINT fk_tsk_activity_user
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE;

-- ============================================================================
-- 4. SEQUENCE TABLES (for auto-generated business codes)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- biz_code_sequence: Generic sequence generator for business codes
-- Stores the last-used counter per code prefix + date combination.
-- Application layer reads, increments, and writes back atomically.
-- ---------------------------------------------------------------------------
CREATE TABLE biz_code_sequence (
    id              BIGSERIAL       PRIMARY KEY,
    code_prefix     VARCHAR(20)     NOT NULL,   -- e.g. TSK, BOM, PRJ
    biz_date        DATE            NOT NULL,   -- Date component of the code
    last_seq        INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_biz_code_seq UNIQUE (code_prefix, biz_date)
);

COMMENT ON TABLE  biz_code_sequence IS 'Atomic sequence generator for auto-generating business codes like task_no, bom_no';
COMMENT ON COLUMN biz_code_sequence.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN biz_code_sequence.code_prefix IS 'Business code prefix, e.g. TSK, BOM, PRJ';
COMMENT ON COLUMN biz_code_sequence.biz_date IS 'Date component for daily reset of sequence counter';
COMMENT ON COLUMN biz_code_sequence.last_seq IS 'Last used sequence number for this prefix+date combination';
COMMENT ON COLUMN biz_code_sequence.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN biz_code_sequence.updated_at IS 'Row last-update timestamp';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
