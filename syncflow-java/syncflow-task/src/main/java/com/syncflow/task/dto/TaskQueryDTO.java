package com.syncflow.task.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * Query filters for task list pagination.
 */
@Data
public class TaskQueryDTO {

    /** Filter by project. */
    private Long projectId;

    /** Filter by phase. */
    private Long phaseId;

    /** Filter by task types (e.g. TASK, MILESTONE, ISSUE). */
    private List<String> types;

    /** Filter by status codes (e.g. 1, 2, 4). */
    private List<Integer> statuses;

    /** Filter by assignee. */
    private Long assigneeId;

    /** Full-text keyword search on title / description. */
    private String keyword;

    /** Filter by overdue flag. */
    private Boolean isOverdue;

    /** Planned start date range -- lower bound (inclusive). */
    private LocalDate startDateFrom;

    /** Planned start date range -- upper bound (inclusive). */
    private LocalDate startDateTo;

    /** Due date range -- lower bound (inclusive). */
    private LocalDate dueDateFrom;

    /** Due date range -- upper bound (inclusive). */
    private LocalDate dueDateTo;
}
