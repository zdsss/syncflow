-- ============================================================================
-- SyncFlow H2 Test Schema
-- Auto-generated from PostgreSQL migrations (COMMENT ON stripped for H2 compatibility)
-- H2 runs in MODE=PostgreSQL
-- ============================================================================

CREATE TABLE sys_department (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    code            VARCHAR(50)     NOT NULL UNIQUE,
    parent_id       BIGINT,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);


CREATE INDEX idx_sys_dept_parent ON sys_department(parent_id);

ALTER TABLE sys_department
    ADD CONSTRAINT fk_sys_dept_parent
    FOREIGN KEY (parent_id) REFERENCES sys_department(id) ON DELETE SET NULL;

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


CREATE INDEX idx_sys_user_tenant ON sys_user(tenant_id);
CREATE INDEX idx_sys_user_dept   ON sys_user(dept_id);
CREATE INDEX idx_sys_user_status ON sys_user(status);
CREATE INDEX idx_sys_user_email  ON sys_user(email);

ALTER TABLE sys_user
    ADD CONSTRAINT fk_sys_user_dept
    FOREIGN KEY (dept_id) REFERENCES sys_department(id) ON DELETE SET NULL;

CREATE TABLE sys_role (
    id              BIGSERIAL       PRIMARY KEY,
    code            VARCHAR(50)     NOT NULL UNIQUE,
    name            VARCHAR(100)    NOT NULL,
    description     VARCHAR(500),
    tenant_id       BIGINT          NOT NULL DEFAULT 1
);


CREATE INDEX idx_sys_role_tenant ON sys_role(tenant_id);

CREATE TABLE sys_user_role (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    role_id         BIGINT          NOT NULL,
    scope_type      VARCHAR(20),
    scope_id        BIGINT,
    CONSTRAINT uq_sys_user_role UNIQUE (user_id, role_id, scope_type, scope_id)
);


CREATE INDEX idx_sys_user_role_user ON sys_user_role(user_id);
CREATE INDEX idx_sys_user_role_role ON sys_user_role(role_id);

ALTER TABLE sys_user_role
    ADD CONSTRAINT fk_sys_user_role_user
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE;

ALTER TABLE sys_user_role
    ADD CONSTRAINT fk_sys_user_role_role
    FOREIGN KEY (role_id) REFERENCES sys_role(id) ON DELETE CASCADE;

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


CREATE INDEX idx_sys_perm_parent ON sys_permission(parent_id);

ALTER TABLE sys_permission
    ADD CONSTRAINT fk_sys_perm_parent
    FOREIGN KEY (parent_id) REFERENCES sys_permission(id) ON DELETE SET NULL;


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


CREATE INDEX idx_prj_phase_project ON prj_phase(project_id);

ALTER TABLE prj_phase
    ADD CONSTRAINT fk_prj_phase_project
    FOREIGN KEY (project_id) REFERENCES prj_project(id) ON DELETE CASCADE;

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


CREATE INDEX idx_prj_stage_gate_phase ON prj_stage_gate(phase_id);

ALTER TABLE prj_stage_gate
    ADD CONSTRAINT fk_prj_stage_gate_phase
    FOREIGN KEY (phase_id) REFERENCES prj_phase(id) ON DELETE CASCADE;

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


CREATE INDEX idx_prj_milestone_project ON prj_milestone(project_id);
CREATE INDEX idx_prj_milestone_phase   ON prj_milestone(phase_id);

ALTER TABLE prj_milestone
    ADD CONSTRAINT fk_prj_milestone_project
    FOREIGN KEY (project_id) REFERENCES prj_project(id) ON DELETE CASCADE;

ALTER TABLE prj_milestone
    ADD CONSTRAINT fk_prj_milestone_phase
    FOREIGN KEY (phase_id) REFERENCES prj_phase(id) ON DELETE SET NULL;

CREATE TABLE prj_project_member (
    id              BIGSERIAL       PRIMARY KEY,
    project_id      BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    project_role    VARCHAR(50),
    dept_id         BIGINT,
    joined_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_prj_member UNIQUE (project_id, user_id)
);


CREATE INDEX idx_prj_member_user ON prj_project_member(user_id);

ALTER TABLE prj_project_member
    ADD CONSTRAINT fk_prj_member_project
    FOREIGN KEY (project_id) REFERENCES prj_project(id) ON DELETE CASCADE;

ALTER TABLE prj_project_member
    ADD CONSTRAINT fk_prj_member_user
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE;


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

CREATE TABLE tsk_task_participant (
    id              BIGSERIAL       PRIMARY KEY,
    task_id         BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    role            VARCHAR(20),    -- COLLABORATOR, REVIEWER, APPROVER
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tsk_participant UNIQUE (task_id, user_id)
);


CREATE INDEX idx_tsk_participant_user ON tsk_task_participant(user_id);

ALTER TABLE tsk_task_participant
    ADD CONSTRAINT fk_tsk_participant_task
    FOREIGN KEY (task_id) REFERENCES tsk_task(id) ON DELETE CASCADE;

ALTER TABLE tsk_task_participant
    ADD CONSTRAINT fk_tsk_participant_user
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE;

CREATE TABLE tsk_task_watcher (
    id              BIGSERIAL       PRIMARY KEY,
    task_id         BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tsk_watcher UNIQUE (task_id, user_id)
);


CREATE INDEX idx_tsk_watcher_user ON tsk_task_watcher(user_id);

ALTER TABLE tsk_task_watcher
    ADD CONSTRAINT fk_tsk_watcher_task
    FOREIGN KEY (task_id) REFERENCES tsk_task(id) ON DELETE CASCADE;

ALTER TABLE tsk_task_watcher
    ADD CONSTRAINT fk_tsk_watcher_user
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE;

CREATE TABLE tsk_task_comment (
    id              BIGSERIAL       PRIMARY KEY,
    task_id         BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL,
    content         TEXT            NOT NULL,
    mentioned_users VARCHAR(500),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_tsk_comment_task ON tsk_task_comment(task_id);
CREATE INDEX idx_tsk_comment_user ON tsk_task_comment(user_id);

ALTER TABLE tsk_task_comment
    ADD CONSTRAINT fk_tsk_comment_task
    FOREIGN KEY (task_id) REFERENCES tsk_task(id) ON DELETE CASCADE;

ALTER TABLE tsk_task_comment
    ADD CONSTRAINT fk_tsk_comment_user
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE;

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


CREATE INDEX idx_tsk_activity_task ON tsk_task_activity(task_id);
CREATE INDEX idx_tsk_activity_user ON tsk_task_activity(user_id);
CREATE INDEX idx_tsk_activity_action ON tsk_task_activity(action);

ALTER TABLE tsk_task_activity
    ADD CONSTRAINT fk_tsk_activity_task
    FOREIGN KEY (task_id) REFERENCES tsk_task(id) ON DELETE CASCADE;

ALTER TABLE tsk_task_activity
    ADD CONSTRAINT fk_tsk_activity_user
    FOREIGN KEY (user_id) REFERENCES sys_user(id) ON DELETE CASCADE;


CREATE TABLE biz_code_sequence (
    id              BIGSERIAL       PRIMARY KEY,
    code_prefix     VARCHAR(20)     NOT NULL,   -- e.g. TSK, BOM, PRJ
    biz_date        DATE            NOT NULL,   -- Date component of the code
    last_seq        INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_biz_code_seq UNIQUE (code_prefix, biz_date)
);




CREATE TABLE bom_bom (
    id              BIGSERIAL       PRIMARY KEY,
    bom_no          VARCHAR(50)     NOT NULL UNIQUE,
    name            VARCHAR(200)    NOT NULL,
    version         VARCHAR(20)     NOT NULL DEFAULT '1.0',
    project_id      BIGINT,
    order_product_id BIGINT,
    product_code    VARCHAR(100),
    product_name    VARCHAR(200),
    status          SMALLINT        NOT NULL DEFAULT 1,
    flow_instance_id VARCHAR(100),
    is_latest       BOOLEAN         NOT NULL DEFAULT TRUE,
    parent_bom_id   BIGINT,
    change_summary  TEXT,
    total_items     INT             NOT NULL DEFAULT 0,
    total_weight    DECIMAL(15,3),
    tenant_id       BIGINT          NOT NULL DEFAULT 1,
    created_by      BIGINT          NOT NULL,
    approved_by     BIGINT,
    approved_at     TIMESTAMP,
    released_at     TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);


CREATE INDEX idx_bom_bom_project ON bom_bom(project_id);
CREATE INDEX idx_bom_bom_status  ON bom_bom(status);
CREATE INDEX idx_bom_bom_tenant  ON bom_bom(tenant_id);
CREATE INDEX idx_bom_bom_latest  ON bom_bom(is_latest);
CREATE INDEX idx_bom_bom_parent  ON bom_bom(parent_bom_id);

CREATE TABLE bom_item (
    id                  BIGSERIAL       PRIMARY KEY,
    bom_id              BIGINT          NOT NULL,
    parent_id           BIGINT,
    level               INT             NOT NULL DEFAULT 1,
    path                VARCHAR(500),
    seq_no              INT             NOT NULL DEFAULT 0,
    level_no            VARCHAR(50),
    material_code       VARCHAR(100),
    drawing_no          VARCHAR(100),
    name                VARCHAR(200)    NOT NULL,
    specification       VARCHAR(500),
    material            VARCHAR(100),
    surface_treatment   VARCHAR(100),
    unit                VARCHAR(20),
    unit_price          DECIMAL(15,4),
    weight              DECIMAL(10,3),
    total_weight        DECIMAL(15,3),
    quantity            DECIMAL(15,4)   NOT NULL DEFAULT 1,
    source_type         VARCHAR(30)     NOT NULL,
    is_virtual          BOOLEAN         NOT NULL DEFAULT FALSE,
    storage_location    VARCHAR(100),
    unit_of_measure     VARCHAR(20),
    incoming_inspection VARCHAR(10),
    is_optional         BOOLEAN         NOT NULL DEFAULT FALSE,
    remark              TEXT,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_bom_item_bom_id    ON bom_item(bom_id);
CREATE INDEX idx_bom_item_parent_id ON bom_item(parent_id);

ALTER TABLE bom_item
    ADD CONSTRAINT fk_bom_item_bom
    FOREIGN KEY (bom_id) REFERENCES bom_bom(id) ON DELETE CASCADE;

ALTER TABLE bom_item
    ADD CONSTRAINT fk_bom_item_parent
    FOREIGN KEY (parent_id) REFERENCES bom_item(id) ON DELETE SET NULL;

CREATE TABLE bom_version (
    id              BIGSERIAL       PRIMARY KEY,
    bom_id          BIGINT          NOT NULL,
    version         VARCHAR(20)     NOT NULL,
    change_summary  TEXT,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_bom_version UNIQUE (bom_id, version)
);


CREATE INDEX idx_bom_version_bom ON bom_version(bom_id);

ALTER TABLE bom_version
    ADD CONSTRAINT fk_bom_version_bom
    FOREIGN KEY (bom_id) REFERENCES bom_bom(id) ON DELETE CASCADE;


CREATE TABLE prc_process_route (
    id                  BIGSERIAL       PRIMARY KEY,
    route_no            VARCHAR(50)     NOT NULL UNIQUE,
    name                VARCHAR(200)    NOT NULL,
    version             VARCHAR(20)     NOT NULL DEFAULT '1.0',
    bom_id              BIGINT,
    project_id          BIGINT,
    order_product_id    BIGINT,
    product_code        VARCHAR(100),
    product_name        VARCHAR(200),
    status              SMALLINT        NOT NULL DEFAULT 1,
    flow_instance_id    VARCHAR(100),
    is_latest           BOOLEAN         NOT NULL DEFAULT TRUE,
    total_operations    INT             NOT NULL DEFAULT 0,
    total_man_hours     DECIMAL(10,2),
    total_material_cost DECIMAL(15,2),
    tenant_id           BIGINT          NOT NULL DEFAULT 1,
    created_by          BIGINT          NOT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at          TIMESTAMP
);


CREATE INDEX idx_prc_route_bom     ON prc_process_route(bom_id);
CREATE INDEX idx_prc_route_project ON prc_process_route(project_id);
CREATE INDEX idx_prc_route_status  ON prc_process_route(status);

CREATE TABLE prc_operation (
    id                  BIGSERIAL       PRIMARY KEY,
    route_id            BIGINT          NOT NULL,
    seq_no              INT             NOT NULL,
    operation_no        VARCHAR(20),
    name                VARCHAR(100)    NOT NULL,
    description         TEXT,
    material_code       VARCHAR(100),
    material_name       VARCHAR(200),
    drawing_no          VARCHAR(100),
    source_type         VARCHAR(30),
    is_virtual          BOOLEAN         NOT NULL DEFAULT FALSE,
    work_center_id      BIGINT,
    work_center_code    VARCHAR(50),
    work_center_name    VARCHAR(100),
    status              SMALLINT        NOT NULL DEFAULT 1,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_prc_operation_route ON prc_operation(route_id);

ALTER TABLE prc_operation
    ADD CONSTRAINT fk_prc_operation_route
    FOREIGN KEY (route_id) REFERENCES prc_process_route(id) ON DELETE CASCADE;

CREATE TABLE prc_man_hour (
    id              BIGSERIAL       PRIMARY KEY,
    operation_id    BIGINT          NOT NULL,
    work_type       VARCHAR(50),
    hours           DECIMAL(10,2)   NOT NULL,
    worker_count    INT             NOT NULL DEFAULT 1,
    is_critical     BOOLEAN         NOT NULL DEFAULT FALSE,
    remark          VARCHAR(500)
);


CREATE INDEX idx_prc_man_hour_op ON prc_man_hour(operation_id);

ALTER TABLE prc_man_hour
    ADD CONSTRAINT fk_prc_man_hour_operation
    FOREIGN KEY (operation_id) REFERENCES prc_operation(id) ON DELETE CASCADE;

CREATE TABLE prc_operation_material (
    id              BIGSERIAL       PRIMARY KEY,
    operation_id    BIGINT          NOT NULL,
    material_code   VARCHAR(100),
    material_name   VARCHAR(200),
    specification   VARCHAR(200),
    quantity        DECIMAL(15,4)   NOT NULL,
    unit            VARCHAR(20),
    loss_rate       DECIMAL(5,2),
    remark          VARCHAR(500)
);


CREATE INDEX idx_prc_op_mat_op ON prc_operation_material(operation_id);

ALTER TABLE prc_operation_material
    ADD CONSTRAINT fk_prc_op_mat_operation
    FOREIGN KEY (operation_id) REFERENCES prc_operation(id) ON DELETE CASCADE;


CREATE TABLE cfg_module_category (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    code            VARCHAR(50)     UNIQUE,
    parent_id       BIGINT,
    path            VARCHAR(500),
    level           INT             NOT NULL DEFAULT 1,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);


CREATE INDEX idx_cfg_mod_cat_parent ON cfg_module_category(parent_id);

ALTER TABLE cfg_module_category
    ADD CONSTRAINT fk_cfg_mod_cat_parent
    FOREIGN KEY (parent_id) REFERENCES cfg_module_category(id) ON DELETE SET NULL;

CREATE TABLE cfg_module (
    id              BIGSERIAL       PRIMARY KEY,
    category_id     BIGINT          NOT NULL,
    code            VARCHAR(50)     NOT NULL UNIQUE,
    name            VARCHAR(100)    NOT NULL,
    description     TEXT,
    status          SMALLINT        NOT NULL DEFAULT 1,
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);


CREATE INDEX idx_cfg_module_category ON cfg_module(category_id);

ALTER TABLE cfg_module
    ADD CONSTRAINT fk_cfg_module_category
    FOREIGN KEY (category_id) REFERENCES cfg_module_category(id);

CREATE TABLE cfg_module_spec (
    id              BIGSERIAL       PRIMARY KEY,
    module_id       BIGINT          NOT NULL,
    spec_name       VARCHAR(100)    NOT NULL,
    cross_section   VARCHAR(100),
    material        VARCHAR(100),
    wall_thickness  DECIMAL(10,2),
    connection_type VARCHAR(100),
    spec_code       VARCHAR(50),
    status          SMALLINT        NOT NULL DEFAULT 1,
    flow_instance_id VARCHAR(100),
    release_at      TIMESTAMP,
    created_by      BIGINT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_cfg_mod_spec_module ON cfg_module_spec(module_id);

ALTER TABLE cfg_module_spec
    ADD CONSTRAINT fk_cfg_mod_spec_module
    FOREIGN KEY (module_id) REFERENCES cfg_module(id);

CREATE TABLE cfg_spec_param (
    id              BIGSERIAL       PRIMARY KEY,
    spec_id         BIGINT          NOT NULL,
    param_name      VARCHAR(100)    NOT NULL,
    param_type      VARCHAR(20)     NOT NULL,
    control_type    VARCHAR(20)     NOT NULL,
    default_value   VARCHAR(200),
    options         VARCHAR(500),
    min_value       DECIMAL(15,4),
    max_value       DECIMAL(15,4),
    unit            VARCHAR(20),
    sort_order      INT             NOT NULL DEFAULT 0,
    is_required     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_cfg_spec_param_spec ON cfg_spec_param(spec_id);

ALTER TABLE cfg_spec_param
    ADD CONSTRAINT fk_cfg_spec_param_spec
    FOREIGN KEY (spec_id) REFERENCES cfg_module_spec(id) ON DELETE CASCADE;

CREATE TABLE cfg_order_category (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    code            VARCHAR(50)     UNIQUE,
    level           INT             NOT NULL DEFAULT 1,
    parent_id       BIGINT,
    path            VARCHAR(500),
    sort_order      INT             NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);


CREATE INDEX idx_cfg_ord_cat_parent ON cfg_order_category(parent_id);

ALTER TABLE cfg_order_category
    ADD CONSTRAINT fk_cfg_ord_cat_parent
    FOREIGN KEY (parent_id) REFERENCES cfg_order_category(id) ON DELETE SET NULL;

CREATE TABLE cfg_order_product (
    id              BIGSERIAL       PRIMARY KEY,
    category_id     BIGINT          NOT NULL,
    code            VARCHAR(50)     NOT NULL UNIQUE,
    name            VARCHAR(200)    NOT NULL,
    description     TEXT,
    status          SMALLINT        NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);


CREATE INDEX idx_cfg_ord_prod_category ON cfg_order_product(category_id);

ALTER TABLE cfg_order_product
    ADD CONSTRAINT fk_cfg_ord_prod_category
    FOREIGN KEY (category_id) REFERENCES cfg_order_category(id);

CREATE TABLE cfg_product_bom (
    id              BIGSERIAL       PRIMARY KEY,
    product_id      BIGINT          NOT NULL,
    bom_id          BIGINT          NOT NULL,
    is_default      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_cfg_prod_bom_product ON cfg_product_bom(product_id);
CREATE INDEX idx_cfg_prod_bom_bom     ON cfg_product_bom(bom_id);

ALTER TABLE cfg_product_bom
    ADD CONSTRAINT fk_cfg_prod_bom_product
    FOREIGN KEY (product_id) REFERENCES cfg_order_product(id);

ALTER TABLE cfg_product_bom
    ADD CONSTRAINT fk_cfg_prod_bom_bom
    FOREIGN KEY (bom_id) REFERENCES bom_bom(id);

CREATE TABLE sta_dashboard_data (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT,
    data_type VARCHAR(50) NOT NULL,
    "value" DECIMAL(15,2),
    dimension VARCHAR(50),
    dimension_value VARCHAR(100),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sta_task_statistics (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT,
    user_id BIGINT,
    stat_date DATE,
    total_tasks INT DEFAULT 0,
    completed_tasks INT DEFAULT 0,
    overdue_tasks INT DEFAULT 0,
    warning_tasks INT DEFAULT 0,
    total_hours DECIMAL(10,2) DEFAULT 0,
    completed_hours DECIMAL(10,2) DEFAULT 0,
    issue_count INT DEFAULT 0,
    risk_count INT DEFAULT 0,
    milestone_count INT DEFAULT 0,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id, stat_date)
);

CREATE TABLE sta_man_hour_ranking (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    user_name VARCHAR(100),
    project_id BIGINT,
    hours DECIMAL(10,2) NOT NULL,
    ranking_date DATE,
    ranking INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sta_dashboard_project ON sta_dashboard_data(project_id, data_type);
CREATE INDEX idx_sta_task_stats ON sta_task_statistics(project_id, user_id, stat_date);
CREATE INDEX idx_sta_ranking ON sta_man_hour_ranking(project_id, ranking_date);

CREATE TABLE notification (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    type            VARCHAR(50)     NOT NULL,
    title           VARCHAR(200)    NOT NULL,
    content         TEXT,
    related_type    VARCHAR(50),
    related_id      BIGINT,
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at         TIMESTAMP
);


CREATE INDEX idx_notification_user ON notification(user_id, is_read);
CREATE INDEX idx_notification_created ON notification(created_at);

CREATE TABLE notification_setting (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL UNIQUE,
    task_reminder   BOOLEAN         NOT NULL DEFAULT TRUE,
    email_notify    BOOLEAN         NOT NULL DEFAULT TRUE,
    app_notify      BOOLEAN         NOT NULL DEFAULT TRUE,
    sms_notify      BOOLEAN         NOT NULL DEFAULT FALSE,
    reminder_days   INT             NOT NULL DEFAULT 3
);


CREATE TABLE fil_file (
    id BIGSERIAL PRIMARY KEY,
    file_no VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    extension VARCHAR(20),
    mime_type VARCHAR(100),
    size BIGINT,
    storage_path VARCHAR(500),
    bucket VARCHAR(100),
    check_sum VARCHAR(64),
    project_id BIGINT,
    biz_type VARCHAR(50),
    biz_id BIGINT,
    version INT DEFAULT 1,
    is_latest BOOLEAN DEFAULT TRUE,
    status SMALLINT DEFAULT 1,
    flow_instance_id VARCHAR(100),
    locked_by BIGINT,
    locked_at TIMESTAMP,
    uploader_id BIGINT NOT NULL,
    tenant_id BIGINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE fil_folder (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id BIGINT,
    path VARCHAR(500),
    project_id BIGINT,
    owner_id BIGINT,
    is_public BOOLEAN DEFAULT FALSE,
    tenant_id BIGINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE fil_file_version (
    id BIGSERIAL PRIMARY KEY,
    file_id BIGINT NOT NULL REFERENCES fil_file(id),
    version INT NOT NULL,
    storage_path VARCHAR(500),
    size BIGINT,
    change_summary TEXT,
    uploader_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fil_file_project ON fil_file(project_id);
CREATE INDEX idx_fil_file_biz ON fil_file(biz_type, biz_id);
CREATE INDEX idx_fil_folder_project ON fil_folder(project_id);
CREATE INDEX idx_fil_folder_parent ON fil_folder(parent_id);

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


CREATE INDEX idx_wf_approval_config_type_key ON wf_approval_config(object_type, process_key);
CREATE INDEX idx_wf_approval_config_enabled  ON wf_approval_config(enabled);

INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled) VALUES
('BOM', 'BOM_APPROVAL', 'techReview', '技术负责人审核', 'PROJECT_ROLE', 'TECH_LEADER', 10, true),
('BOM', 'BOM_APPROVAL', 'processReview', '工艺路线审核', 'PROJECT_ROLE', 'PROCESS_ENGINEER', 20, true),
('BOM', 'BOM_APPROVAL', 'qualityReview', '质量审核', 'PROJECT_ROLE', 'QUALITY_ENGINEER', 30, true),
('BOM', 'BOM_APPROVAL', 'pmApproval', '项目经理批准', 'PROJECT_ROLE', 'PROJECT_MANAGER', 40, true);

INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled) VALUES
('STAGE_GATE', 'STAGE_GATE_APPROVAL', 'startApproval', '启动审批', 'PROJECT_ROLE', 'PROJECT_MANAGER', 10, true),
('STAGE_GATE', 'STAGE_GATE_APPROVAL', 'finalApproval', '批准', 'PROJECT_ROLE', 'PROJECT_MANAGER', 20, true);

INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled) VALUES
('PROCESS_ROUTE', 'PROCESS_APPROVAL', 'techReview', '技术审核', 'PROJECT_ROLE', 'TECH_LEADER', 10, true),
('PROCESS_ROUTE', 'PROCESS_APPROVAL', 'processReview', '工艺审核', 'PROJECT_ROLE', 'PROCESS_ENGINEER', 20, true);

INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled) VALUES
('MODULE_SPEC', 'MODULE_SPEC_APPROVAL', 'deptReview', '部门审核', 'DEPARTMENT', 'DEPARTMENT_HEAD', 10, true),
('MODULE_SPEC', 'MODULE_SPEC_APPROVAL', 'techReview', '技术审核', 'PROJECT_ROLE', 'TECH_LEADER', 20, true);

INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled) VALUES
('CHANGE', 'CHANGE_APPROVAL', 'impactReview', '影响评估', 'PROJECT_ROLE', 'TECH_LEADER', 10, true),
('CHANGE', 'CHANGE_APPROVAL', 'techReview', '技术审核', 'PROJECT_ROLE', 'TECH_LEADER', 20, true),
('CHANGE', 'CHANGE_APPROVAL', 'pmApproval', '项目经理批准', 'PROJECT_ROLE', 'PROJECT_MANAGER', 30, true);

INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled) VALUES
('FILE', 'FILE_APPROVAL', 'review', '文件审核', 'PROJECT_ROLE', 'PROJECT_MANAGER', 10, true);

-- ============================================================================
-- V8: Approval workflow tables (H2-compatible)
-- ============================================================================

CREATE TABLE IF NOT EXISTS wf_business_object (
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

CREATE INDEX IF NOT EXISTS idx_bo_flow_instance ON wf_business_object(flow_instance_id);
CREATE INDEX IF NOT EXISTS idx_bo_current_task  ON wf_business_object(current_task_id);
CREATE INDEX IF NOT EXISTS idx_bo_object_type_id ON wf_business_object(object_type, object_id);

CREATE TABLE IF NOT EXISTS wf_delegation (
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

CREATE INDEX IF NOT EXISTS idx_delegation_from_active ON wf_delegation(from_user_id, is_active);

CREATE TABLE IF NOT EXISTS wf_cc_record (
    id                 BIGSERIAL    PRIMARY KEY,
    business_object_id BIGINT       NOT NULL,
    user_id            BIGINT       NOT NULL,
    is_read            BOOLEAN      NOT NULL DEFAULT FALSE,
    read_at            TIMESTAMP,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cc_user          ON wf_cc_record(user_id);
CREATE INDEX IF NOT EXISTS idx_cc_business_object ON wf_cc_record(business_object_id);

CREATE TABLE IF NOT EXISTS wf_approval_comment (
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

CREATE INDEX IF NOT EXISTS idx_ac_business_object ON wf_approval_comment(business_object_id);

CREATE TABLE IF NOT EXISTS wf_change_request (
    id               BIGSERIAL    PRIMARY KEY,
    object_type      VARCHAR(50)  NOT NULL,
    object_id        BIGINT       NOT NULL,
    change_type      VARCHAR(30)  NOT NULL,
    change_data      CLOB         NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_cr_object ON wf_change_request(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_cr_status ON wf_change_request(status);

-- ALTER TABLEs (H2-compatible)
ALTER TABLE fil_file ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE fil_file ADD COLUMN IF NOT EXISTS published_by BIGINT;
ALTER TABLE prj_project ADD COLUMN IF NOT EXISTS flow_instance_id VARCHAR(64);

-- V8 seed: approval configs for new object types
INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES ('MILESTONE', 'GENERIC_APPROVAL', 'approval', '项目经理批准', 'PROJECT_ROLE', 'PROJECT_MANAGER', 10, true);

INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES ('ISSUE', 'GENERIC_APPROVAL', 'approval', '技术审核', 'PROJECT_ROLE', 'TECH_LEADER', 10, true);

INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES ('RISK', 'GENERIC_APPROVAL', 'approval', '风险确认', 'PROJECT_ROLE', 'PROJECT_MANAGER', 10, true);

INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES ('PROJECT', 'GENERIC_APPROVAL', 'approval', '部门负责人审批', 'DEPARTMENT', 'APPLICANT_DEPT', 10, true);

INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES
('BOM_CHANGE', 'CHANGE_APPROVAL', 'impactReview', '影响评估', 'PROJECT_ROLE', 'PROCESS_ENGINEER', 10, true),
('BOM_CHANGE', 'CHANGE_APPROVAL', 'techReview',   '技术审核', 'PROJECT_ROLE', 'TECH_LEADER',     20, true),
('BOM_CHANGE', 'CHANGE_APPROVAL', 'pmApproval',   '项目经理批准', 'PROJECT_ROLE', 'PROJECT_MANAGER', 30, true);

INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES
('PROCESS_CHANGE', 'CHANGE_APPROVAL', 'impactReview', '影响评估', 'PROJECT_ROLE', 'QUALITY_ENGINEER',  10, true),
('PROCESS_CHANGE', 'CHANGE_APPROVAL', 'techReview',   '技术审核', 'PROJECT_ROLE', 'PROCESS_ENGINEER',  20, true),
('PROCESS_CHANGE', 'CHANGE_APPROVAL', 'pmApproval',   '项目经理批准', 'PROJECT_ROLE', 'PROJECT_MANAGER',   30, true);

INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES
('SPEC_CHANGE', 'CHANGE_APPROVAL', 'impactReview', '影响评估', 'DEPARTMENT', 'APPLICANT_DEPT', 10, true),
('SPEC_CHANGE', 'CHANGE_APPROVAL', 'techReview',   '技术审核', 'USER',       '1',              20, true),
('SPEC_CHANGE', 'CHANGE_APPROVAL', 'pmApproval',   '批准',     'USER',       '1',              30, true);

INSERT INTO wf_approval_config (object_type, process_key, node_id, node_name, rule_type, rule_value, priority, enabled)
VALUES
('FILE_BOM',      'FILE_APPROVAL', 'review', '文件审核', 'PROJECT_ROLE', 'TECH_LEADER',      10, true),
('FILE_PROCESS',  'FILE_APPROVAL', 'review', '文件审核', 'PROJECT_ROLE', 'PROCESS_ENGINEER', 10, true),
('FILE_DOCUMENT', 'FILE_APPROVAL', 'review', '文件审核', 'PROJECT_ROLE', 'PROJECT_MANAGER',  10, true);
