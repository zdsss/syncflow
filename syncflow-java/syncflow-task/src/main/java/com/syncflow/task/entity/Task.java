package com.syncflow.task.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Core task / work-item entity.
 * <p>
 * Maps to the {@code tsk_task} table.
 */
@Data
@TableName("tsk_task")
public class Task {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** Auto-generated human-readable task number, e.g. TSK-20260506-0001. */
    private String taskNo;

    /** Task title / summary. */
    private String title;

    /** Detailed task description (rich text). */
    private String description;

    /** Task type: TASK, MILESTONE, ISSUE, RISK, SUGGESTION, CHANGE, ACTIVITY, STAGE, APPROVAL. */
    private String type;

    /** FK to prj_project.id. */
    private Long projectId;

    /** FK to prj_phase.id. */
    private Long phaseId;

    /** FK to prj_milestone.id. */
    private Long milestoneId;

    /** FK to tsk_task.id for sub-task hierarchy. */
    private Long parentId;

    /** Materialised ancestor path for fast tree queries. */
    private String parentPath;

    /** 1=pending, 2=in_progress, 3=pending_review, 4=completed, 5=cancelled. */
    private Integer status;

    /** Priority: 1=URGENT, 2=HIGH, 3=MEDIUM, 4=LOW. Defaults to 3 (MEDIUM). */
    private Integer priority;

    /** Completion percentage 0-100. */
    private Integer progress;

    /** FK to sys_user.id, primary assignee. */
    private Long assigneeId;

    /** FK to sys_user.id, task creator / reporter. */
    private Long reporterId;

    /** Planned start date. */
    private LocalDate plannedStart;

    /** Planned end date. */
    private LocalDate plannedEnd;

    /** Estimated hours for the task. */
    private BigDecimal plannedHours;

    /** Estimated working days. */
    private Integer plannedDays;

    /** Actual start date. */
    private LocalDate actualStart;

    /** Actual end date. */
    private LocalDate actualEnd;

    /** Actual hours spent. */
    private BigDecimal actualHours;

    /** Hard deadline for the task. */
    private LocalDate dueDate;

    /** True if task has passed its due_date without completion. */
    private Boolean isOverdue;

    /** True if task is approaching due_date threshold. */
    private Boolean isWarning;

    /** Comma-separated tags for categorisation and filtering. */
    private String tags;

    /** Sub-category within task type. */
    private String taskCategory;

    /** Workflow engine instance identifier. */
    private String flowInstanceId;

    /** Workflow task identifier within the flow instance. */
    private String taskIdInFlow;

    /** Denormalised comment count for list queries. */
    private Integer commentCount;

    /** Denormalised attachment count for list queries. */
    private Integer attachmentCount;

    /** Denormalised watcher count for list queries. */
    private Integer watcherCount;

    /** Tenant identifier for multi-tenancy. */
    private Long tenantId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
