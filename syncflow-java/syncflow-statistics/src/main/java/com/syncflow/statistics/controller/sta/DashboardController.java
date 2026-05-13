package com.syncflow.statistics.controller.sta;

import com.syncflow.common.result.Result;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.statistics.dto.*;
import com.syncflow.statistics.service.DashboardService;
import com.syncflow.workflow.dto.ApprovalTaskVO;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Dashboard / statistics controller.
 * <p>
 * All endpoints accept an optional {@code projectId} query parameter
 * to scope results to a specific project.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * Get the full dashboard aggregate.
     */
    @GetMapping
    public Result<DashboardVO> getDashboard(
            @RequestParam(required = false) Long projectId) {
        DashboardVO vo = dashboardService.getDashboard(projectId);
        return Result.success(vo);
    }

    /**
     * Get tasks completed in the last 30 days.
     */
    @GetMapping("/completed-tasks")
    public Result<List<TaskStatVO>> getCompletedTasks(
            @RequestParam(required = false) Long projectId) {
        List<TaskStatVO> result = dashboardService.getCompletedTasks(projectId);
        return Result.success(result);
    }

    /**
     * Get overdue tasks.
     */
    @GetMapping("/overdue-tasks")
    public Result<List<TaskStatVO>> getOverdueTasks(
            @RequestParam(required = false) Long projectId) {
        List<TaskStatVO> result = dashboardService.getOverdueTasks(projectId);
        return Result.success(result);
    }

    /**
     * Get risk-type tasks.
     */
    @GetMapping("/risks")
    public Result<List<RiskStatVO>> getRisks(
            @RequestParam(required = false) Long projectId) {
        List<RiskStatVO> result = dashboardService.getRisks(projectId);
        return Result.success(result);
    }

    /**
     * Get current tasks (in progress, due this week).
     */
    @GetMapping("/current-tasks")
    public Result<List<TaskStatVO>> getCurrentTasks(
            @RequestParam(required = false) Long projectId) {
        List<TaskStatVO> result = dashboardService.getCurrentTasks(projectId);
        return Result.success(result);
    }

    /**
     * Get next tasks (due next week).
     */
    @GetMapping("/next-tasks")
    public Result<List<TaskStatVO>> getNextTasks(
            @RequestParam(required = false) Long projectId) {
        List<TaskStatVO> result = dashboardService.getNextTasks(projectId);
        return Result.success(result);
    }

    /**
     * Get top 10 man-hour ranking with pie chart data.
     */
    @GetMapping("/man-hour-ranking")
    public Result<ManHourRankingVO> getManHourRanking(
            @RequestParam(required = false) Long projectId) {
        ManHourRankingVO vo = dashboardService.getManHourRanking(projectId);
        return Result.success(vo);
    }

    /**
     * Get on-time completion rate ranking per user.
     */
    @GetMapping("/on-time-rate-ranking")
    public Result<List<OnTimeRateVO>> getOnTimeRateRanking(
            @RequestParam(required = false) Long projectId) {
        List<OnTimeRateVO> result = dashboardService.getOnTimeRateRanking(projectId);
        return Result.success(result);
    }

    /**
     * Get activities currently in progress.
     */
    @GetMapping("/in-progress-activities")
    public Result<List<TaskStatVO>> getInProgressActivities(
            @RequestParam(required = false) Long projectId) {
        List<TaskStatVO> result = dashboardService.getInProgressActivities(projectId);
        return Result.success(result);
    }

    /**
     * Get aggregated summary statistics.
     */
    @GetMapping("/summary")
    public Result<DashboardSummaryVO> getSummary() {
        DashboardSummaryVO result = dashboardService.getSummary();
        return Result.success(result);
    }

    /**
     * Get project progress list.
     */
    @GetMapping("/project-progress")
    public Result<List<ProjectProgressVO>> getProjectProgress() {
        List<ProjectProgressVO> result = dashboardService.getProjectProgress();
        return Result.success(result);
    }

    /**
     * Get milestones due within 30 days.
     */
    @GetMapping("/upcoming-milestones")
    public Result<List<UpcomingMilestoneVO>> getUpcomingMilestones() {
        List<UpcomingMilestoneVO> result = dashboardService.getUpcomingMilestones();
        return Result.success(result);
    }

    /**
     * Get pending approvals scoped to the current user.
     */
    @GetMapping("/pending-approvals")
    public Result<List<ApprovalTaskVO>> getPendingApprovals() {
        Long currentUserId = SecurityUtils.getUserId();
        List<ApprovalTaskVO> result = dashboardService.getPendingApprovals(currentUserId);
        return Result.success(result);
    }

    /**
     * Get warning tasks (approaching due date).
     */
    @GetMapping("/warnings")
    public Result<List<TaskStatVO>> getWarnings() {
        List<TaskStatVO> result = dashboardService.getWarnings();
        return Result.success(result);
    }

    /**
     * Get suggestion tasks.
     */
    @GetMapping("/suggestions")
    public Result<List<TaskStatVO>> getSuggestions() {
        List<TaskStatVO> result = dashboardService.getSuggestions();
        return Result.success(result);
    }

    /**
     * Get combined project + task overview.
     */
    @GetMapping("/overview")
    public Result<DashboardOverviewVO> getOverview() {
        DashboardOverviewVO result = dashboardService.getOverview();
        return Result.success(result);
    }
}
