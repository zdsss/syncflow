-- Process route version history table
CREATE TABLE prc_route_version (
    id              BIGSERIAL       PRIMARY KEY,
    route_id        BIGINT          NOT NULL,
    version         VARCHAR(20)     NOT NULL,
    description     TEXT,
    snapshot_json   TEXT,
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_prc_route_version UNIQUE (route_id, version)
);

COMMENT ON TABLE  prc_route_version IS 'Process route version history';
COMMENT ON COLUMN prc_route_version.route_id IS 'FK to prc_process_route.id';
COMMENT ON COLUMN prc_route_version.version IS 'Version string (e.g. 1.0, 1.1)';
COMMENT ON COLUMN prc_route_version.description IS 'Version description/change summary';
COMMENT ON COLUMN prc_route_version.snapshot_json IS 'JSON snapshot of operations at this version';
COMMENT ON COLUMN prc_route_version.created_by IS 'FK to sys_user.id';

CREATE INDEX idx_prc_route_version_route ON prc_route_version(route_id);

ALTER TABLE prc_route_version
    ADD CONSTRAINT fk_prc_route_version_route
    FOREIGN KEY (route_id) REFERENCES prc_process_route(id) ON DELETE CASCADE;

-- Add FK constraint from prc_process_route.bom_id to bom_bom.id
ALTER TABLE prc_process_route
    ADD CONSTRAINT fk_prc_route_bom
    FOREIGN KEY (bom_id) REFERENCES bom_bom(id) ON DELETE SET NULL;
