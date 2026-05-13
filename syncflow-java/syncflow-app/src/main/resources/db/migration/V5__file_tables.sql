-- V3: File management tables

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
