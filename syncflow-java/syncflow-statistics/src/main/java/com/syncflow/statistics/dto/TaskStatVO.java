package com.syncflow.statistics.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Task statistics view object for dashboard lists.
 */
@Data
public class TaskStatVO {

    /** Task ID. */
    private Long taskId;

    /** Task number. */
    private String taskNo;

    /** Task title. */
    private String title;

    /** Project display name. */
    private String projectName;

    /** Assignee display name. */
    private String assigneeName;

    /**
     * Task status label: pending, in_progress, completed, etc.
     */
    private String status;

    /** Due date of the task. */
    private LocalDate dueDate;

    /** Actual completion timestamp. */
    private LocalDateTime completedAt;

    /** Task type. */
    private String type;

    /** Actual hours spent. */
    private BigDecimal actualHours;

    /** Planned hours. */
    private BigDecimal plannedHours;
}
