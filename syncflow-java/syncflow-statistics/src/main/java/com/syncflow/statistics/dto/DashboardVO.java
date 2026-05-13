package com.syncflow.statistics.dto;

import lombok.Data;

import java.util.List;

/**
 * Full dashboard aggregate response.
 */
@Data
public class DashboardVO {

    /** Tasks completed recently (last 30 days). */
    private List<TaskStatVO> completedTasks;

    /** Tasks that are overdue. */
    private List<TaskStatVO> overdueTasks;

    /** Tasks of type RISK. */
    private List<RiskStatVO> risks;

    /** Tasks currently in progress (due this week). */
    private List<TaskStatVO> currentTasks;

    /** Tasks due next week. */
    private List<TaskStatVO> nextTasks;

    /** Top 10 man-hour ranking with pie chart data. */
    private ManHourRankingVO manHourRanking;

    /** On-time completion rate ranking per user. */
    private List<OnTimeRateVO> onTimeRateRanking;

    /** Activities currently in progress. */
    private List<TaskStatVO> inProgressActivities;
}
