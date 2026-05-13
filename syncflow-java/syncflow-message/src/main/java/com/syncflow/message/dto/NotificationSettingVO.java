package com.syncflow.message.dto;

import lombok.Data;

/**
 * View / update DTO for notification settings.
 */
@Data
public class NotificationSettingVO {

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
