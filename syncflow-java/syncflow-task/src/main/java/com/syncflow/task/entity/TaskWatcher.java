package com.syncflow.task.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Task watcher entity -- users subscribed to task change notifications.
 * <p>
 * Maps to the {@code tsk_task_watcher} table.
 */
@Data
@TableName("tsk_task_watcher")
public class TaskWatcher {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to tsk_task.id. */
    private Long taskId;

    /** FK to sys_user.id. */
    private Long userId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
