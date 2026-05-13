package com.syncflow.task.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Task participant entity (collaborators, reviewers, approvers).
 * <p>
 * Maps to the {@code tsk_task_participant} table.
 */
@Data
@TableName("tsk_task_participant")
public class TaskParticipant {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to tsk_task.id. */
    private Long taskId;

    /** FK to sys_user.id. */
    private Long userId;

    /** Participant role: COLLABORATOR, REVIEWER, APPROVER. */
    private String role;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
