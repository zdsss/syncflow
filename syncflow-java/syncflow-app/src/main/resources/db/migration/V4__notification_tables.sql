-- ============================================================================
-- SyncFlow V4 Notification Tables
-- Message notification module - PostgreSQL Migration
-- ============================================================================

-- ---------------------------------------------------------------------------
-- notification: User notification records
-- ---------------------------------------------------------------------------
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

COMMENT ON TABLE  notification IS 'User notification messages';
COMMENT ON COLUMN notification.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN notification.user_id IS 'FK to sys_user.id, notification recipient';
COMMENT ON COLUMN notification.type IS 'Notification type: TASK, APPROVAL, SYSTEM, COMMENT, MENTION';
COMMENT ON COLUMN notification.title IS 'Notification title / summary';
COMMENT ON COLUMN notification.content IS 'Notification body text';
COMMENT ON COLUMN notification.related_type IS 'Type of related entity: TASK, PROJECT, BOM, etc.';
COMMENT ON COLUMN notification.related_id IS 'FK to the related entity';
COMMENT ON COLUMN notification.is_read IS 'Whether the user has read this notification';
COMMENT ON COLUMN notification.created_at IS 'When the notification was created';
COMMENT ON COLUMN notification.read_at IS 'When the user read the notification, NULL if unread';

CREATE INDEX idx_notification_user ON notification(user_id, is_read);
CREATE INDEX idx_notification_created ON notification(created_at);

-- ---------------------------------------------------------------------------
-- notification_setting: Per-user notification preferences
-- ---------------------------------------------------------------------------
CREATE TABLE notification_setting (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL UNIQUE,
    task_reminder   BOOLEAN         NOT NULL DEFAULT TRUE,
    email_notify    BOOLEAN         NOT NULL DEFAULT TRUE,
    app_notify      BOOLEAN         NOT NULL DEFAULT TRUE,
    sms_notify      BOOLEAN         NOT NULL DEFAULT FALSE,
    reminder_days   INT             NOT NULL DEFAULT 3
);

COMMENT ON TABLE  notification_setting IS 'Per-user notification preferences';
COMMENT ON COLUMN notification_setting.id IS 'Primary key, auto-increment';
COMMENT ON COLUMN notification_setting.user_id IS 'FK to sys_user.id, unique per user';
COMMENT ON COLUMN notification_setting.task_reminder IS 'Enable task deadline reminders';
COMMENT ON COLUMN notification_setting.email_notify IS 'Enable email notifications';
COMMENT ON COLUMN notification_setting.app_notify IS 'Enable in-app push notifications';
COMMENT ON COLUMN notification_setting.sms_notify IS 'Enable SMS notifications';
COMMENT ON COLUMN notification_setting.reminder_days IS 'Days before due date to send reminder';
