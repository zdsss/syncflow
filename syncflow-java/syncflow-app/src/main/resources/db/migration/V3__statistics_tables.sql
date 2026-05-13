CREATE TABLE sta_dashboard_data (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT,
    data_type VARCHAR(50) NOT NULL,
    value DECIMAL(15,2),
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
