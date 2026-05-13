package com.syncflow.task.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * View object returned for task list queries.
 */
@Data
public class TaskListVO {

    private Long id;

    private String taskNo;

    private String title;

    private String type;

    /** Chinese display label for the type. */
    private String typeName;

    private Integer status;

    /** Priority: 1=URGENT, 2=HIGH, 3=MEDIUM, 4=LOW. */
    private Integer priority;

    private Integer progress;

    /** FK to prj_project.id. */
    private Long projectId;

    /** Name of the associated project (joined from prj_project). */
    private String projectName;

    /** FK to sys_user.id, primary assignee. */
    private Long assigneeId;

    /** Display name of the assignee (joined from sys_user). */
    private String assigneeName;

    /** FK to prj_milestone.id, if linked to a milestone. */
    private Long milestoneId;

    private LocalDate dueDate;

    private Boolean isOverdue;

    private Boolean isWarning;

    private Integer commentCount;

    /** Whether the current user is watching this task. */
    private Boolean isWatching;
}
