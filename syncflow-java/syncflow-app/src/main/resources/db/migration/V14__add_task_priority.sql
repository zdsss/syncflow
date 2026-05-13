-- V14: Add priority column to tsk_task
-- Priority: 1=URGENT, 2=HIGH, 3=MEDIUM (default), 4=LOW

ALTER TABLE tsk_task ADD COLUMN priority INTEGER NOT NULL DEFAULT 3;

COMMENT ON COLUMN tsk_task.priority IS '1=URGENT, 2=HIGH, 3=MEDIUM, 4=LOW';
