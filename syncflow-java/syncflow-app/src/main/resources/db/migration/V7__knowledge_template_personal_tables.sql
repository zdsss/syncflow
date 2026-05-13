-- ============================================================================
-- SyncFlow V7 Knowledge / Template / Personal / Resource Tables
-- Created: 2026-05-07
-- ============================================================================

-- ---------------------------------------------------------------------------
-- kng_article: Knowledge base articles
-- ---------------------------------------------------------------------------
CREATE TABLE kng_article (
    id              BIGSERIAL       PRIMARY KEY,
    title           VARCHAR(200)    NOT NULL,
    content         TEXT,
    category        VARCHAR(100),
    author_id       BIGINT,
    tags            VARCHAR(500),
    view_count      INT             NOT NULL DEFAULT 0,
    tenant_id       BIGINT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  kng_article IS 'Knowledge base articles';
COMMENT ON COLUMN kng_article.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN kng_article.title IS 'Article title';
COMMENT ON COLUMN kng_article.content IS 'Article content (rich text)';
COMMENT ON COLUMN kng_article.category IS 'Article category for grouping';
COMMENT ON COLUMN kng_article.author_id IS 'FK to sys_user.id, article author';
COMMENT ON COLUMN kng_article.tags IS 'Comma-separated tags';
COMMENT ON COLUMN kng_article.view_count IS 'View counter';
COMMENT ON COLUMN kng_article.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN kng_article.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN kng_article.updated_at IS 'Row last-update timestamp';
COMMENT ON COLUMN kng_article.deleted_at IS 'Soft-delete timestamp, NULL means not deleted';

CREATE INDEX idx_kng_article_category ON kng_article(category);
CREATE INDEX idx_kng_article_author   ON kng_article(author_id);
CREATE INDEX idx_kng_article_tenant   ON kng_article(tenant_id);

-- ---------------------------------------------------------------------------
-- kng_article_comment: Knowledge article comments
-- ---------------------------------------------------------------------------
CREATE TABLE kng_article_comment (
    id              BIGSERIAL       PRIMARY KEY,
    article_id      BIGINT          NOT NULL,
    author_id       BIGINT          NOT NULL,
    content         TEXT            NOT NULL,
    parent_id       BIGINT,
    tenant_id       BIGINT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  kng_article_comment IS 'Knowledge article comments';
COMMENT ON COLUMN kng_article_comment.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN kng_article_comment.article_id IS 'FK to kng_article.id';
COMMENT ON COLUMN kng_article_comment.author_id IS 'FK to sys_user.id, comment author';
COMMENT ON COLUMN kng_article_comment.content IS 'Comment text content';
COMMENT ON COLUMN kng_article_comment.parent_id IS 'FK to kng_article_comment.id for reply threading';
COMMENT ON COLUMN kng_article_comment.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN kng_article_comment.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN kng_article_comment.updated_at IS 'Row last-update timestamp';
COMMENT ON COLUMN kng_article_comment.deleted_at IS 'Soft-delete timestamp, NULL means not deleted';

CREATE INDEX idx_kng_comment_article ON kng_article_comment(article_id);
CREATE INDEX idx_kng_comment_author  ON kng_article_comment(author_id);
CREATE INDEX idx_kng_comment_parent  ON kng_article_comment(parent_id);

-- ---------------------------------------------------------------------------
-- tpl_template: Reusable templates
-- ---------------------------------------------------------------------------
CREATE TABLE tpl_template (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(200)    NOT NULL,
    description     TEXT,
    type            VARCHAR(50),
    content         JSONB,
    category        VARCHAR(100),
    creator_id      BIGINT,
    usage_count     INT             NOT NULL DEFAULT 0,
    tenant_id       BIGINT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  tpl_template IS 'Reusable project / task templates';
COMMENT ON COLUMN tpl_template.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN tpl_template.name IS 'Template display name';
COMMENT ON COLUMN tpl_template.description IS 'Template description';
COMMENT ON COLUMN tpl_template.type IS 'Template type: PROJECT, TASK, etc.';
COMMENT ON COLUMN tpl_template.content IS 'Template content stored as JSON';
COMMENT ON COLUMN tpl_template.category IS 'Template category for grouping';
COMMENT ON COLUMN tpl_template.creator_id IS 'FK to sys_user.id, template creator';
COMMENT ON COLUMN tpl_template.usage_count IS 'Number of times applied';
COMMENT ON COLUMN tpl_template.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN tpl_template.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN tpl_template.updated_at IS 'Row last-update timestamp';
COMMENT ON COLUMN tpl_template.deleted_at IS 'Soft-delete timestamp, NULL means not deleted';

CREATE INDEX idx_tpl_template_creator  ON tpl_template(creator_id);
CREATE INDEX idx_tpl_template_category ON tpl_template(category);
CREATE INDEX idx_tpl_template_type     ON tpl_template(type);

-- ---------------------------------------------------------------------------
-- prs_personal_file: User personal files
-- ---------------------------------------------------------------------------
CREATE TABLE prs_personal_file (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    file_path       VARCHAR(500),
    size            BIGINT,
    user_id         BIGINT          NOT NULL,
    tenant_id       BIGINT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  prs_personal_file IS 'User personal files';
COMMENT ON COLUMN prs_personal_file.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN prs_personal_file.name IS 'Display name for the file';
COMMENT ON COLUMN prs_personal_file.file_path IS 'Storage path or URL';
COMMENT ON COLUMN prs_personal_file.size IS 'File size in bytes';
COMMENT ON COLUMN prs_personal_file.user_id IS 'FK to sys_user.id, file owner';
COMMENT ON COLUMN prs_personal_file.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN prs_personal_file.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN prs_personal_file.updated_at IS 'Row last-update timestamp';
COMMENT ON COLUMN prs_personal_file.deleted_at IS 'Soft-delete timestamp, NULL means not deleted';

CREATE INDEX idx_prs_file_user ON prs_personal_file(user_id);

-- ---------------------------------------------------------------------------
-- prs_note: User personal notes
-- ---------------------------------------------------------------------------
CREATE TABLE prs_note (
    id              BIGSERIAL       PRIMARY KEY,
    title           VARCHAR(200),
    content         TEXT,
    user_id         BIGINT          NOT NULL,
    tags            VARCHAR(500),
    tenant_id       BIGINT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  prs_note IS 'User personal notes';
COMMENT ON COLUMN prs_note.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN prs_note.title IS 'Note title';
COMMENT ON COLUMN prs_note.content IS 'Note content (rich text)';
COMMENT ON COLUMN prs_note.user_id IS 'FK to sys_user.id, note owner';
COMMENT ON COLUMN prs_note.tags IS 'Comma-separated tags';
COMMENT ON COLUMN prs_note.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN prs_note.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN prs_note.updated_at IS 'Row last-update timestamp';
COMMENT ON COLUMN prs_note.deleted_at IS 'Soft-delete timestamp, NULL means not deleted';

CREATE INDEX idx_prs_note_user ON prs_note(user_id);

-- ---------------------------------------------------------------------------
-- res_resource: Shared resources (tools, terminology, references)
-- ---------------------------------------------------------------------------
CREATE TABLE res_resource (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(200)    NOT NULL,
    type            VARCHAR(50),
    description     TEXT,
    status          SMALLINT        NOT NULL DEFAULT 1,
    content         JSONB,
    tenant_id       BIGINT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at      TIMESTAMP
);

COMMENT ON TABLE  res_resource IS 'Shared resources: tools, terminology, references';
COMMENT ON COLUMN res_resource.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN res_resource.name IS 'Resource name';
COMMENT ON COLUMN res_resource.type IS 'Resource type: TOOL, TERMINOLOGY, REFERENCE';
COMMENT ON COLUMN res_resource.description IS 'Resource description';
COMMENT ON COLUMN res_resource.status IS 'Resource status: 1=active, 0=inactive';
COMMENT ON COLUMN res_resource.content IS 'Extended content stored as JSON';
COMMENT ON COLUMN res_resource.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON COLUMN res_resource.created_at IS 'Row creation timestamp';
COMMENT ON COLUMN res_resource.updated_at IS 'Row last-update timestamp';
COMMENT ON COLUMN res_resource.deleted_at IS 'Soft-delete timestamp, NULL means not deleted';

CREATE INDEX idx_res_resource_type ON res_resource(type);
