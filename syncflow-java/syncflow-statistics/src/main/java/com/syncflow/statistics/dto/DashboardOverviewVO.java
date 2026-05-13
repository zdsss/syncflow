package com.syncflow.statistics.dto;

import lombok.Data;

/**
 * Dashboard overview aggregate for the overview card.
 */
@Data
public class DashboardOverviewVO {

    /** Total active projects. */
    private long totalProjects;

    /** Projects with status = in_progress. */
    private long inProgress;

    /** Projects with status = completed. */
    private long completed;

    /** Projects with status = delayed. */
    private long delayed;

    /** Total active tasks (not cancelled). */
    private long totalTasks;

    /** Tasks with status = completed. */
    private long completedTasks;

    /** Tasks with status = in_progress. */
    private long inProgressTasks;

    /** Overdue tasks (not completed/cancelled). */
    private long overdueTasks;
}
