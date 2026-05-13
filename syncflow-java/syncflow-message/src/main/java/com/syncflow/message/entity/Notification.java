package com.syncflow.message.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * User notification entity.
 * <p>
 * Maps to the {@code notification} table.
 */
@Data
@TableName("notification")
public class Notification {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to sys_user.id — notification recipient. */
    private Long userId;

    /** Notification type: TASK, APPROVAL, SYSTEM, COMMENT, MENTION. */
    private String type;

    /** Notification title / summary. */
    private String title;

    /** Notification body text. */
    private String content;

    /** Type of related entity: TASK, PROJECT, BOM, etc. */
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
