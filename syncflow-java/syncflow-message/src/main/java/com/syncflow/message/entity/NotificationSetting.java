package com.syncflow.message.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * Per-user notification preference entity.
 * <p>
 * Maps to the {@code notification_setting} table.
 */
@Data
@TableName("notification_setting")
public class NotificationSetting {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to sys_user.id — unique per user. */
    private Long userId;

    /** Enable task deadline reminders. */
    private Boolean taskReminder;

    /** Enable email notifications. */
    private Boolean emailNotify;

    /** Enable in-app push notifications. */
    private Boolean appNotify;

    /** Enable SMS notifications. */
    private Boolean smsNotify;

    /** Days before due date to send reminder. */
    private Integer reminderDays;
}
