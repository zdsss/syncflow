package com.syncflow.statistics.service;

import com.syncflow.common.config.CacheConfig;
import com.syncflow.statistics.dto.*;
import com.syncflow.workflow.dto.ApprovalTaskVO;
import org.springframework.cache.annotation.Cacheable;

import java.util.List;

/**
 * Dashboard / statistics service interface.
 */
public interface DashboardService {

    /**
     * Aggregate all dashboard data for a project.
     */
    @Cacheable(value = CacheConfig.CACHE_DASHBOARD_SUMMARY, key = "#root.args[0] != null ? #root.args[0] : 'all'")
    DashboardVO getDashboard(Long projectId);

    /**
     * Tasks completed in the last 30 days.
     */
    List<TaskStatVO> getCompletedTasks(Long projectId);

    /**
     * Tasks that are overdue (is_overdue = true).
     */
    List<TaskStatVO> getOverdueTasks(Long projectId);

    /**
     * Tasks of type RISK.
     */
    List<RiskStatVO> getRisks(Long projectId);

    /**
     * Tasks in progress that are due this week.
     */
    List<TaskStatVO> getCurrentTasks(Long projectId);

    /**
     * Tasks due next week.
     */
    List<TaskStatVO> getNextTasks(Long projectId);

    /**
     * Top 10 man-hour ranking with pie chart data.
     */
    ManHourRankingVO getManHourRanking(Long projectId);

    /**
     * On-time completion rate ranking per user.
     */
    List<OnTimeRateVO> getOnTimeRateRanking(Long projectId);

    /**
     * Activities currently in progress (type = ACTIVITY, status = IN_PROGRESS).
     */
    List<TaskStatVO> getInProgressActivities(Long projectId);

    /**
     * Aggregated summary statistics for the overview card.
     */
    DashboardSummaryVO getSummary();

    /**
     * Progress of each active project.
     */
    List<ProjectProgressVO> getProjectProgress();

    /**
     * Milestones due within the next 30 days.
     */
    List<UpcomingMilestoneVO> getUpcomingMilestones();

    /**
     * Pending approval items for the current user.
     */
    List<ApprovalTaskVO> getPendingApprovals(Long userId);

    /**
     * Tasks flagged as warnings (approaching due date).
     */
    List<TaskStatVO> getWarnings();

    /**
     * Tasks of type SUGGESTION.
     */
    List<TaskStatVO> getSuggestions();

    /**
     * Combined overview of projects and tasks.
     */
    DashboardOverviewVO getOverview();

    /**
     * Frontend-aligned flat dashboard stats.
     */
    FrontendDashboardVO getFrontendDashboard(Long projectId);
}
