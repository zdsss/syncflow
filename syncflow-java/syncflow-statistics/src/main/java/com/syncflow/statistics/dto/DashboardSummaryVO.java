package com.syncflow.statistics.dto;

import lombok.Data;

/**
 * Dashboard summary statistics for the overview card.
 */
@Data
public class DashboardSummaryVO {

    /** Total active tasks (not cancelled). */
    private long totalTasks;

    /** Tasks with status = completed. */
    private long completed;

    /** Tasks with status = in_progress. */
    private long inProgress;

    /** Overdue tasks (not completed/cancelled). */
    private long overdue;

    /** Tasks with status = pending (not started). */
    private long notStarted;

    /** Tasks with status = pending_review (awaiting approval). */
    private long pendingReview;

    /** Tasks with type = ACTIVITY that are urgent. */
    private long urgent;

    /** Tasks with is_warning = true (approaching due date). */
    private long warnings;

    /** Tasks with type = RISK. */
    private long risks;

    /** Tasks with type = SUGGESTION. */
    private long suggestions;

    /** Tasks due today. */
    private long todayTasks;

    /** Tasks due this week. */
    private long weekTasks;
}
