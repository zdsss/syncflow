package com.syncflow.task.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * View object for a task activity entry (audit trail).
 */
@Data
public class TaskActivityVO {

    private Long id;

    private Long taskId;

    private Long userId;

    /** Display name of the user who performed the action. */
    private String userName;

    /** Action type: CREATED, UPDATED, STATUS_CHANGED, etc. */
    private String action;

    /** Name of the field that was changed, null for non-field actions. */
    private String fieldName;

    /** Previous value of the changed field. */
    private String oldValue;

    /** New value of the changed field. */
    private String newValue;

    private LocalDateTime createdAt;
}
