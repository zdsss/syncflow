-- Performance indexes for common query patterns
-- V10: performance_indexes

-- Task queries
CREATE INDEX IF NOT EXISTS idx_task_project_id ON tsk_task(project_id);
CREATE INDEX IF NOT EXISTS idx_task_assignee_id ON tsk_task(assignee_id);
CREATE INDEX IF NOT EXISTS idx_task_status ON tsk_task(status);
CREATE INDEX IF NOT EXISTS idx_task_project_status ON tsk_task(project_id, status);
CREATE INDEX IF NOT EXISTS idx_task_updated_at ON tsk_task(updated_at);

-- BOM queries
CREATE INDEX IF NOT EXISTS idx_bom_project_id ON bom_bom(project_id);
CREATE INDEX IF NOT EXISTS idx_bom_status ON bom_bom(status);

-- File queries
CREATE INDEX IF NOT EXISTS idx_file_project_id ON fil_file(project_id);
CREATE INDEX IF NOT EXISTS idx_file_biz ON fil_file(biz_type, biz_id);

-- Notification queries
CREATE INDEX IF NOT EXISTS idx_notification_user_read ON notification(user_id, is_read);

-- Approval/workflow queries
CREATE INDEX IF NOT EXISTS idx_business_object_type ON wf_business_object(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_change_request_type ON wf_change_request(object_type, object_id);

-- Activity/audit trail
CREATE INDEX IF NOT EXISTS idx_task_activity_task ON tsk_task_activity(task_id);
