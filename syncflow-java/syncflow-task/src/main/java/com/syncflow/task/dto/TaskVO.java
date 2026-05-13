package com.syncflow.task.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Full detail view object for a single task.
 * <p>
 * Includes all entity fields plus denormalised display names and the
 * current user's watching status.
 */
@Data
public class TaskVO {

    private Long id;

    private String taskNo;

    private String title;

    private String description;

    /** Task type code: TASK, MILESTONE, ISSUE, etc. */
    private String type;

    /** Chinese display label for the type. */
    private String typeName;

    private Long projectId;

    private Long phaseId;

    private Long milestoneId;

    private Long parentId;

    private String parentPath;

    /** Status integer code (1-5). */
    private Integer status;

    /** Priority: 1=URGENT, 2=HIGH, 3=MEDIUM, 4=LOW. */
    private Integer priority;

    private Integer progress;

    private Long assigneeId;

    private Long reporterId;

    private LocalDate plannedStart;

    private LocalDate plannedEnd;

    private BigDecimal plannedHours;

    private Integer plannedDays;

    private LocalDate actualStart;

    private LocalDate actualEnd;

    private BigDecimal actualHours;

    private LocalDate dueDate;

    private Boolean isOverdue;

    private Boolean isWarning;

    private String tags;

    private String taskCategory;

    private String flowInstanceId;

    private String taskIdInFlow;

    private Integer commentCount;

    private Integer attachmentCount;

    private Integer watcherCount;

    // ---- Enriched display fields ----

    /** Display name of the assignee (from sys_user.real_name). */
    private String assigneeName;

    /** Display name of the reporter (from sys_user.real_name). */
    private String reporterName;

    /** Name of the associated project (from prj_project.name). */
    private String projectName;

    /** Whether the current authenticated user is watching this task. */
    private Boolean isWatching;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
