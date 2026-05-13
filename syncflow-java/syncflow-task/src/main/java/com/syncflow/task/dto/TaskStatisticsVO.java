package com.syncflow.task.dto;

import lombok.Data;

/**
 * Task statistics view object.
 * <p>
 * Contains counts for dashboard summary cards.
 */
@Data
public class TaskStatisticsVO {

    /** Tasks due today. */
    private long today;

    /** Tasks due this week. */
    private long thisWeek;

    /** Tasks due this month. */
    private long thisMonth;

    /** Total task count. */
    private long total;

    /** Tasks in warning state. */
    private long warning;

    /** Overdue tasks. */
    private long overdue;

    /** Count by type: ISSUE. */
    private long issueCount;

    /** Count by type: RISK. */
    private long riskCount;

    /** Count by type: SUGGESTION. */
    private long suggestionCount;

    /** Count by type: MILESTONE. */
    private long milestoneCount;

    /** Count by type: ACTIVITY. */
    private long activityCount;

    /** Count by type: CHANGE. */
    private long changeCount;

    /** Count by type: TASK. */
    private long taskCount;

    /** Count by type: STAGE. */
    private long stageCount;

    /** Count by type: APPROVAL. */
    private long approvalCount;

    /** Count by status: PENDING. */
    private long pendingCount;

    /** Count by status: IN_PROGRESS. */
    private long inProgressCount;

    /** Count by status: COMPLETED. */
    private long completedCount;

    /** Count by status: CANCELLED. */
    private long cancelledCount;

    /** Count by status: ON_HOLD. */
    private long onHoldCount;

    /** Count by status: OVERDUE. */
    private long overdueCount;
}
