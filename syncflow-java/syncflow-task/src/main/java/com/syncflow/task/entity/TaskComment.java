package com.syncflow.task.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Task comment entity -- comments and discussions attached to tasks.
 * <p>
 * Maps to the {@code tsk_task_comment} table.
 */
@Data
@TableName("tsk_task_comment")
public class TaskComment {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to tsk_task.id. */
    private Long taskId;

    /** FK to sys_user.id, comment author. */
    private Long userId;

    /** Comment body (rich text or markdown). */
    private String content;

    /** Comma-separated user IDs mentioned in the comment. */
    private String mentionedUsers;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
