package com.syncflow.message.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * View object returned to the client for a single notification.
 */
@Data
public class NotificationVO {

    private Long id;

    /** Notification type: TASK, APPROVAL, SYSTEM, COMMENT, MENTION. */
    private String type;

    /** Notification title / summary. */
    private String title;

    /** Notification body text. */
    private String content;

    /** Type of related entity. */
    private String relatedType;

    /** FK to the related entity. */
    private Long relatedId;

    /** Whether the user has read this notification. */
    private Boolean isRead;

    /** When the notification was created. */
    private LocalDateTime createdAt;

    /** When the user read the notification, null if unread. */
    private LocalDateTime readAt;
}
