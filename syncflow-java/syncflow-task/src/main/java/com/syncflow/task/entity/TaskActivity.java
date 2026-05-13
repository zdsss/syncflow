package com.syncflow.task.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Task activity entity -- audit trail of all changes made to tasks.
 * <p>
 * Maps to the {@code tsk_task_activity} table.
 */
@Data
@TableName("tsk_task_activity")
public class TaskActivity {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to tsk_task.id. */
    private Long taskId;

    /** FK to sys_user.id, user who made the change. */
    private Long userId;

    /** Action type: CREATED, UPDATED, STATUS_CHANGED, ASSIGNED, COMMENTED, etc. */
    private String action;

    /** Name of the field that was changed, NULL for non-field actions. */
    private String fieldName;

    /** Previous value of the changed field. */
    private String oldValue;

    /** New value of the changed field. */
    private String newValue;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
