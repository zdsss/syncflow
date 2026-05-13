-- ============================================================================
-- SyncFlow V2: BOM / Process / Config Tables
-- Created: 2026-05-06
-- ============================================================================

-- ============================================================================
-- 1. BOM TABLES (bom_*)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- bom_bom: Bill of Materials main entity
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE  bom_bom IS 'Bill of Materials main entity';
COMMENT ON COLUMN bom_bom.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN bom_bom.bom_no IS 'Auto-generated BOM number, e.g. BOM-20260506-0001';
COMMENT ON COLUMN bom_bom.name IS 'BOM display name';
COMMENT ON COLUMN bom_bom.version IS 'Version string, e.g. 1.0, 2.1';
COMMENT ON COLUMN bom_bom.project_id IS 'FK to prj_project.id';
COMMENT ON COLUMN bom_bom.order_product_id IS 'FK to cfg_order_product.id';
COMMENT ON COLUMN bom_bom.product_code IS 'Product code for the BOM';
COMMENT ON COLUMN bom_bom.product_name IS 'Product display name';
COMMENT ON COLUMN bom_bom.status IS '1=editing, 2=pending_approval, 3=published, 4=locked, 5=cancelled';
COMMENT ON COLUMN bom_bom.flow_instance_id IS 'Workflow engine instance identifier';
COMMENT ON COLUMN bom_bom.is_latest IS 'True if this is the latest version of the BOM';
COMMENT ON COLUMN bom_bom.parent_bom_id IS 'FK to bom_bom.id, parent BOM for derived BOMs';
COMMENT ON COLUMN bom_bom.change_summary IS 'Summary of changes for this version';
COMMENT ON COLUMN bom_bom.total_items IS 'Denormalised count of BOM items';
COMMENT ON COLUMN bom_bom.total_weight IS 'Total weight of all items';
COMMENT ON COLUMN bom_bom.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN bom_bom.created_by IS 'FK to sys_user.id, BOM creator';
COMMENT ON COLUMN bom_bom.approved_by IS 'FK to sys_user.id, who approved this BOM';
COMMENT ON COLUMN bom_bom.approved_at IS 'Timestamp when BOM was approved';
COMMENT ON COLUMN bom_bom.released_at IS 'Timestamp when BOM was published/released';
COMMENT ON COLUMN bom_bom.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN bom_bom.updated_at IS 'Row last-update timestamp';
COMMENT ON COLUMN bom_bom.deleted_at IS 'Soft-delete timestamp, NULL means not deleted';

CREATE INDEX idx_bom_bom_project ON bom_bom(project_id);
CREATE INDEX idx_bom_bom_status  ON bom_bom(status);
CREATE INDEX idx_bom_bom_tenant  ON bom_bom(tenant_id);
CREATE INDEX idx_bom_bom_latest  ON bom_bom(is_latest);
CREATE INDEX idx_bom_bom_parent  ON bom_bom(parent_bom_id);

-- ---------------------------------------------------------------------------
-- bom_item: BOM items (tree structure)
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE  bom_item IS 'BOM items forming a tree structure (bill of materials lines)';
COMMENT ON COLUMN bom_item.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN bom_item.bom_id IS 'FK to bom_bom.id';
COMMENT ON COLUMN bom_item.parent_id IS 'FK to bom_item.id, parent item in the tree';
COMMENT ON COLUMN bom_item.level IS 'Depth level in the BOM tree (1 = root)';
COMMENT ON COLUMN bom_item.path IS 'Materialised ancestor path for fast tree queries';
COMMENT ON COLUMN bom_item.seq_no IS 'Sort order among siblings';
COMMENT ON COLUMN bom_item.level_no IS 'Level number string for display (e.g. 1.2.3)';
COMMENT ON COLUMN bom_item.material_code IS 'Material/part code';
COMMENT ON COLUMN bom_item.drawing_no IS 'Drawing number reference';
COMMENT ON COLUMN bom_item.name IS 'Item name';
COMMENT ON COLUMN bom_item.specification IS 'Item specification / description';
COMMENT ON COLUMN bom_item.material IS 'Physical material type';
COMMENT ON COLUMN bom_item.surface_treatment IS 'Surface treatment / finish';
COMMENT ON COLUMN bom_item.unit IS 'Unit of measure for quantity';
COMMENT ON COLUMN bom_item.unit_price IS 'Unit price';
COMMENT ON COLUMN bom_item.weight IS 'Weight per unit';
COMMENT ON COLUMN bom_item.total_weight IS 'Total weight (quantity * weight)';
COMMENT ON COLUMN bom_item.quantity IS 'Required quantity';
COMMENT ON COLUMN bom_item.source_type IS 'Source type: MADE, PURCHASED, SUBCONTRACT';
COMMENT ON COLUMN bom_item.is_virtual IS 'True if virtual/non-physical item';
COMMENT ON COLUMN bom_item.storage_location IS 'Default storage location';
COMMENT ON COLUMN bom_item.unit_of_measure IS 'Alternate unit of measure';
COMMENT ON COLUMN bom_item.incoming_inspection IS 'Incoming inspection flag (YES/NO)';
COMMENT ON COLUMN bom_item.is_optional IS 'True if this is an optional item';
COMMENT ON COLUMN bom_item.remark IS 'Free-form remarks';
COMMENT ON COLUMN bom_item.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN bom_item.updated_at IS 'Row last-update timestamp';

CREATE INDEX idx_bom_item_bom_id    ON bom_item(bom_id);
CREATE INDEX idx_bom_item_parent_id ON bom_item(parent_id);

ALTER TABLE bom_item
    ADD CONSTRAINT fk_bom_item_bom
    FOREIGN KEY (bom_id) REFERENCES bom_bom(id) ON DELETE CASCADE;

ALTER TABLE bom_item
    ADD CONSTRAINT fk_bom_item_parent
    FOREIGN KEY (parent_id) REFERENCES bom_item(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- bom_version: BOM version history
-- ---------------------------------------------------------------------------
CREATE TABLE bom_version (
    id              BIGSERIAL       PRIMARY KEY,
    bom_id          BIGINT          NOT NULL,
    version         VARCHAR(20)     NOT NULL,
    change_summary  TEXT,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_bom_version UNIQUE (bom_id, version)
);

COMMENT ON TABLE  bom_version IS 'BOM version history, one row per snapshot';
COMMENT ON COLUMN bom_version.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN bom_version.bom_id IS 'FK to bom_bom.id';
COMMENT ON COLUMN bom_version.version IS 'Version string (e.g. 1.0, 1.1)';
COMMENT ON COLUMN bom_version.change_summary IS 'Summary of changes in this version';
COMMENT ON COLUMN bom_version.created_by IS 'FK to sys_user.id who created this version';
COMMENT ON COLUMN bom_version.created_at IS 'Row creation timestamp';

CREATE INDEX idx_bom_version_bom ON bom_version(bom_id);

ALTER TABLE bom_version
    ADD CONSTRAINT fk_bom_version_bom
    FOREIGN KEY (bom_id) REFERENCES bom_bom(id) ON DELETE CASCADE;

-- ============================================================================
-- 2. PROCESS ROUTE TABLES (prc_*)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- prc_process_route: Process route / manufacturing route
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE  prc_process_route IS 'Manufacturing process route definitions';
COMMENT ON COLUMN prc_process_route.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN prc_process_route.route_no IS 'Auto-generated route number';
COMMENT ON COLUMN prc_process_route.name IS 'Route display name';
COMMENT ON COLUMN prc_process_route.version IS 'Version string';
COMMENT ON COLUMN prc_process_route.bom_id IS 'FK to bom_bom.id';
COMMENT ON COLUMN prc_process_route.project_id IS 'FK to prj_project.id';
COMMENT ON COLUMN prc_process_route.order_product_id IS 'FK to cfg_order_product.id';
COMMENT ON COLUMN prc_process_route.product_code IS 'Product code for the route';
COMMENT ON COLUMN prc_process_route.product_name IS 'Product display name';
COMMENT ON COLUMN prc_process_route.status IS '1=editing, 2=pending_approval, 3=published, 4=locked, 5=cancelled';
COMMENT ON COLUMN prc_process_route.flow_instance_id IS 'Workflow engine instance identifier';
COMMENT ON COLUMN prc_process_route.is_latest IS 'True if this is the latest version';
COMMENT ON COLUMN prc_process_route.total_operations IS 'Denormalised operation count';
COMMENT ON COLUMN prc_process_route.total_man_hours IS 'Sum of all operation man-hours';
COMMENT ON COLUMN prc_process_route.total_material_cost IS 'Sum of all operation material costs';
COMMENT ON COLUMN prc_process_route.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN prc_process_route.created_by IS 'FK to sys_user.id, route creator';
COMMENT ON COLUMN prc_process_route.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN prc_process_route.updated_at IS 'Row last-update timestamp';
COMMENT ON COLUMN prc_process_route.deleted_at IS 'Soft-delete timestamp';

CREATE INDEX idx_prc_route_bom     ON prc_process_route(bom_id);
CREATE INDEX idx_prc_route_project ON prc_process_route(project_id);
CREATE INDEX idx_prc_route_status  ON prc_process_route(status);

-- ---------------------------------------------------------------------------
-- prc_operation: Operations within a process route
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE  prc_operation IS 'Operations within a process route';
COMMENT ON COLUMN prc_operation.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN prc_operation.route_id IS 'FK to prc_process_route.id';
COMMENT ON COLUMN prc_operation.seq_no IS 'Sequence number within the route';
COMMENT ON COLUMN prc_operation.operation_no IS 'Operation code';
COMMENT ON COLUMN prc_operation.name IS 'Operation display name';
COMMENT ON COLUMN prc_operation.description IS 'Detailed operation description';
COMMENT ON COLUMN prc_operation.material_code IS 'Material code used in this operation';
COMMENT ON COLUMN prc_operation.material_name IS 'Material display name';
COMMENT ON COLUMN prc_operation.drawing_no IS 'Drawing number for this operation';
COMMENT ON COLUMN prc_operation.source_type IS 'Source type: MADE, PURCHASED, SUBCONTRACT';
COMMENT ON COLUMN prc_operation.is_virtual IS 'True if virtual operation';
COMMENT ON COLUMN prc_operation.work_center_id IS 'FK to work center';
COMMENT ON COLUMN prc_operation.work_center_code IS 'Work center code';
COMMENT ON COLUMN prc_operation.work_center_name IS 'Work center display name';
COMMENT ON COLUMN prc_operation.status IS '1=active, 0=inactive';
COMMENT ON COLUMN prc_operation.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN prc_operation.updated_at IS 'Row last-update timestamp';

CREATE INDEX idx_prc_operation_route ON prc_operation(route_id);

ALTER TABLE prc_operation
    ADD CONSTRAINT fk_prc_operation_route
    FOREIGN KEY (route_id) REFERENCES prc_process_route(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- prc_man_hour: Man-hour quotas per operation
-- ---------------------------------------------------------------------------
CREATE TABLE prc_man_hour (
    id              BIGSERIAL       PRIMARY KEY,
    operation_id    BIGINT          NOT NULL,
    work_type       VARCHAR(50),
    hours           DECIMAL(10,2)   NOT NULL,
    worker_count    INT             NOT NULL DEFAULT 1,
    is_critical     BOOLEAN         NOT NULL DEFAULT FALSE,
    remark          VARCHAR(500)
);

COMMENT ON TABLE  prc_man_hour IS 'Man-hour quotas for process operations';
COMMENT ON COLUMN prc_man_hour.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN prc_man_hour.operation_id IS 'FK to prc_operation.id';
COMMENT ON COLUMN prc_man_hour.work_type IS 'Work type category';
COMMENT ON COLUMN prc_man_hour.hours IS 'Hours per worker';
COMMENT ON COLUMN prc_man_hour.worker_count IS 'Number of workers';
COMMENT ON COLUMN prc_man_hour.is_critical IS 'True if critical-path operation';
COMMENT ON COLUMN prc_man_hour.remark IS 'Free-form remark';

CREATE INDEX idx_prc_man_hour_op ON prc_man_hour(operation_id);

ALTER TABLE prc_man_hour
    ADD CONSTRAINT fk_prc_man_hour_operation
    FOREIGN KEY (operation_id) REFERENCES prc_operation(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- prc_operation_material: Material quotas per operation
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE  prc_operation_material IS 'Material quotas consumed by each operation';
COMMENT ON COLUMN prc_operation_material.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN prc_operation_material.operation_id IS 'FK to prc_operation.id';
COMMENT ON COLUMN prc_operation_material.material_code IS 'Material code';
COMMENT ON COLUMN prc_operation_material.material_name IS 'Material display name';
COMMENT ON COLUMN prc_operation_material.specification IS 'Material specification';
COMMENT ON COLUMN prc_operation_material.quantity IS 'Required quantity';
COMMENT ON COLUMN prc_operation_material.unit IS 'Unit of measure';
COMMENT ON COLUMN prc_operation_material.loss_rate IS 'Expected loss rate (percentage)';
COMMENT ON COLUMN prc_operation_material.remark IS 'Free-form remark';

CREATE INDEX idx_prc_op_mat_op ON prc_operation_material(operation_id);

ALTER TABLE prc_operation_material
    ADD CONSTRAINT fk_prc_op_mat_operation
    FOREIGN KEY (operation_id) REFERENCES prc_operation(id) ON DELETE CASCADE;

-- ============================================================================
-- 3. CONFIG / SPEC TABLES (cfg_*)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- cfg_module_category: Module library categories
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE  cfg_module_category IS 'Module library category hierarchy';
COMMENT ON COLUMN cfg_module_category.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN cfg_module_category.name IS 'Category display name';
COMMENT ON COLUMN cfg_module_category.code IS 'Unique category code';
COMMENT ON COLUMN cfg_module_category.parent_id IS 'FK to cfg_module_category.id, NULL for root';
COMMENT ON COLUMN cfg_module_category.path IS 'Materialised ancestor path';
COMMENT ON COLUMN cfg_module_category.level IS 'Depth level in the tree';
COMMENT ON COLUMN cfg_module_category.sort_order IS 'Display sort order among siblings';
COMMENT ON COLUMN cfg_module_category.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN cfg_module_category.deleted_at IS 'Soft-delete timestamp';

CREATE INDEX idx_cfg_mod_cat_parent ON cfg_module_category(parent_id);

ALTER TABLE cfg_module_category
    ADD CONSTRAINT fk_cfg_mod_cat_parent
    FOREIGN KEY (parent_id) REFERENCES cfg_module_category(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- cfg_module: Module library entries
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE  cfg_module IS 'Module library entries';
COMMENT ON COLUMN cfg_module.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN cfg_module.category_id IS 'FK to cfg_module_category.id';
COMMENT ON COLUMN cfg_module.code IS 'Unique module code';
COMMENT ON COLUMN cfg_module.name IS 'Module display name';
COMMENT ON COLUMN cfg_module.description IS 'Module description';
COMMENT ON COLUMN cfg_module.status IS '1=active, 0=inactive';
COMMENT ON COLUMN cfg_module.sort_order IS 'Display sort order';
COMMENT ON COLUMN cfg_module.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN cfg_module.updated_at IS 'Row last-update timestamp';
COMMENT ON COLUMN cfg_module.deleted_at IS 'Soft-delete timestamp';

CREATE INDEX idx_cfg_module_category ON cfg_module(category_id);

ALTER TABLE cfg_module
    ADD CONSTRAINT fk_cfg_module_category
    FOREIGN KEY (category_id) REFERENCES cfg_module_category(id);

-- ---------------------------------------------------------------------------
-- cfg_module_spec: Module specifications
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE  cfg_module_spec IS 'Module specification definitions';
COMMENT ON COLUMN cfg_module_spec.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN cfg_module_spec.module_id IS 'FK to cfg_module.id';
COMMENT ON COLUMN cfg_module_spec.spec_name IS 'Specification display name';
COMMENT ON COLUMN cfg_module_spec.cross_section IS 'Cross section type';
COMMENT ON COLUMN cfg_module_spec.material IS 'Material type';
COMMENT ON COLUMN cfg_module_spec.wall_thickness IS 'Wall thickness';
COMMENT ON COLUMN cfg_module_spec.connection_type IS 'Connection type';
COMMENT ON COLUMN cfg_module_spec.spec_code IS 'Specification code';
COMMENT ON COLUMN cfg_module_spec.status IS '1=draft, 2=published';
COMMENT ON COLUMN cfg_module_spec.flow_instance_id IS 'Workflow instance id for approval';
COMMENT ON COLUMN cfg_module_spec.release_at IS 'Timestamp when spec was released';
COMMENT ON COLUMN cfg_module_spec.created_by IS 'FK to sys_user.id';
COMMENT ON COLUMN cfg_module_spec.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN cfg_module_spec.updated_at IS 'Row last-update timestamp';

CREATE INDEX idx_cfg_mod_spec_module ON cfg_module_spec(module_id);

ALTER TABLE cfg_module_spec
    ADD CONSTRAINT fk_cfg_mod_spec_module
    FOREIGN KEY (module_id) REFERENCES cfg_module(id);

-- ---------------------------------------------------------------------------
-- cfg_spec_param: Specification parameters
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE  cfg_spec_param IS 'Parameters for module specifications';
COMMENT ON COLUMN cfg_spec_param.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN cfg_spec_param.spec_id IS 'FK to cfg_module_spec.id';
COMMENT ON COLUMN cfg_spec_param.param_name IS 'Parameter display name';
COMMENT ON COLUMN cfg_spec_param.param_type IS 'Data type: STRING, INT, DECIMAL, BOOLEAN';
COMMENT ON COLUMN cfg_spec_param.control_type IS 'UI control: INPUT, SELECT, RADIO, CHECKBOX';
COMMENT ON COLUMN cfg_spec_param.default_value IS 'Default value';
COMMENT ON COLUMN cfg_spec_param.options IS 'Comma-separated options for SELECT/RADIO';
COMMENT ON COLUMN cfg_spec_param.min_value IS 'Minimum value for numeric types';
COMMENT ON COLUMN cfg_spec_param.max_value IS 'Maximum value for numeric types';
COMMENT ON COLUMN cfg_spec_param.unit IS 'Unit of measure';
COMMENT ON COLUMN cfg_spec_param.sort_order IS 'Display sort order';
COMMENT ON COLUMN cfg_spec_param.is_required IS 'True if required';
COMMENT ON COLUMN cfg_spec_param.created_at IS 'Row creation timestamp';

CREATE INDEX idx_cfg_spec_param_spec ON cfg_spec_param(spec_id);

ALTER TABLE cfg_spec_param
    ADD CONSTRAINT fk_cfg_spec_param_spec
    FOREIGN KEY (spec_id) REFERENCES cfg_module_spec(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- cfg_order_category: Order product categories
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE  cfg_order_category IS 'Order product category hierarchy';
COMMENT ON COLUMN cfg_order_category.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN cfg_order_category.name IS 'Category display name';
COMMENT ON COLUMN cfg_order_category.code IS 'Unique category code';
COMMENT ON COLUMN cfg_order_category.level IS 'Depth level in the tree';
COMMENT ON COLUMN cfg_order_category.parent_id IS 'FK to cfg_order_category.id, NULL for root';
COMMENT ON COLUMN cfg_order_category.path IS 'Materialised ancestor path';
COMMENT ON COLUMN cfg_order_category.sort_order IS 'Display sort order among siblings';
COMMENT ON COLUMN cfg_order_category.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN cfg_order_category.deleted_at IS 'Soft-delete timestamp';

CREATE INDEX idx_cfg_ord_cat_parent ON cfg_order_category(parent_id);

ALTER TABLE cfg_order_category
    ADD CONSTRAINT fk_cfg_ord_cat_parent
    FOREIGN KEY (parent_id) REFERENCES cfg_order_category(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- cfg_order_product: Order products
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE  cfg_order_product IS 'Order product definitions';
COMMENT ON COLUMN cfg_order_product.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN cfg_order_product.category_id IS 'FK to cfg_order_category.id';
COMMENT ON COLUMN cfg_order_product.code IS 'Unique product code';
COMMENT ON COLUMN cfg_order_product.name IS 'Product display name';
COMMENT ON COLUMN cfg_order_product.description IS 'Product description';
COMMENT ON COLUMN cfg_order_product.status IS '1=active, 0=inactive';
COMMENT ON COLUMN cfg_order_product.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN cfg_order_product.updated_at IS 'Row last-update timestamp';
COMMENT ON COLUMN cfg_order_product.deleted_at IS 'Soft-delete timestamp';

CREATE INDEX idx_cfg_ord_prod_category ON cfg_order_product(category_id);

ALTER TABLE cfg_order_product
    ADD CONSTRAINT fk_cfg_ord_prod_category
    FOREIGN KEY (category_id) REFERENCES cfg_order_category(id);

-- ---------------------------------------------------------------------------
-- cfg_product_bom: Product-to-BOM association
-- ---------------------------------------------------------------------------
CREATE TABLE cfg_product_bom (
    id              BIGSERIAL       PRIMARY KEY,
    product_id      BIGINT          NOT NULL,
    bom_id          BIGINT          NOT NULL,
    is_default      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  cfg_product_bom IS 'Many-to-many association between products and BOMs';
COMMENT ON COLUMN cfg_product_bom.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN cfg_product_bom.product_id IS 'FK to cfg_order_product.id';
COMMENT ON COLUMN cfg_product_bom.bom_id IS 'FK to bom_bom.id';
COMMENT ON COLUMN cfg_product_bom.is_default IS 'True if this is the default BOM for the product';
COMMENT ON COLUMN cfg_product_bom.created_at IS 'Row creation timestamp';

CREATE INDEX idx_cfg_prod_bom_product ON cfg_product_bom(product_id);
CREATE INDEX idx_cfg_prod_bom_bom     ON cfg_product_bom(bom_id);

ALTER TABLE cfg_product_bom
    ADD CONSTRAINT fk_cfg_prod_bom_product
    FOREIGN KEY (product_id) REFERENCES cfg_order_product(id);

ALTER TABLE cfg_product_bom
    ADD CONSTRAINT fk_cfg_prod_bom_bom
    FOREIGN KEY (bom_id) REFERENCES bom_bom(id);

-- ============================================================================
-- END OF V2 MIGRATION
-- ============================================================================
