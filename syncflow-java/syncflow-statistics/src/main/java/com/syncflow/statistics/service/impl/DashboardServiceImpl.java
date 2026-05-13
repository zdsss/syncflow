package com.syncflow.statistics.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.admin.entity.User;
import com.syncflow.admin.mapper.UserMapper;
import com.syncflow.project.entity.Milestone;
import com.syncflow.project.entity.Project;
import com.syncflow.project.mapper.MilestoneMapper;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.statistics.dto.*;
import com.syncflow.statistics.service.DashboardService;
import com.syncflow.common.config.CacheConfig;
import com.syncflow.task.entity.Task;
import com.syncflow.task.mapper.TaskMapper;
import com.syncflow.workflow.dto.ApprovalTaskVO;
import com.syncflow.workflow.service.WorkflowService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Dashboard / statistics service implementation.
 * <p>
 * Queries the task table directly via MyBatis-Plus and enriches with
 * user / project display names.
 */
@Service
public class DashboardServiceImpl implements DashboardService {

    private final TaskMapper taskMapper;
    private final UserMapper userMapper;
    private final ProjectMapper projectMapper;
    private final MilestoneMapper milestoneMapper;
    private final WorkflowService workflowService;

    public DashboardServiceImpl(TaskMapper taskMapper,
                                UserMapper userMapper,
                                ProjectMapper projectMapper,
                                MilestoneMapper milestoneMapper,
                                WorkflowService workflowService) {
        this.taskMapper = taskMapper;
        this.userMapper = userMapper;
        this.projectMapper = projectMapper;
        this.milestoneMapper = milestoneMapper;
        this.workflowService = workflowService;
    }

    // -----------------------------------------------------------------------
    //  Full dashboard
    // -----------------------------------------------------------------------

    @Override
    @Cacheable(value = CacheConfig.CACHE_DASHBOARD_SUMMARY, key = "#root.args[0] != null ? #root.args[0] : 'all'")
    public DashboardVO getDashboard(Long projectId) {
        DashboardVO vo = new DashboardVO();
        vo.setCompletedTasks(getCompletedTasks(projectId));
        vo.setOverdueTasks(getOverdueTasks(projectId));
        vo.setRisks(getRisks(projectId));
        vo.setCurrentTasks(getCurrentTasks(projectId));
        vo.setNextTasks(getNextTasks(projectId));
        vo.setManHourRanking(getManHourRanking(projectId));
        vo.setOnTimeRateRanking(getOnTimeRateRanking(projectId));
        vo.setInProgressActivities(getInProgressActivities(projectId));
        return vo;
    }

    // -----------------------------------------------------------------------
    //  Completed tasks (last 30 days)
    // -----------------------------------------------------------------------

    @Override
    public List<TaskStatVO> getCompletedTasks(Long projectId) {
        LocalDateTime thirtyDaysAgo = LocalDate.now().minusDays(30).atStartOfDay();

        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        applyProjectFilter(wrapper, projectId);
        wrapper.eq(Task::getStatus, 4) // completed
               .ge(Task::getUpdatedAt, thirtyDaysAgo)
               .orderByDesc(Task::getUpdatedAt);

        return toTaskStatVOList(taskMapper.selectList(wrapper));
    }

    // -----------------------------------------------------------------------
    //  Overdue tasks
    // -----------------------------------------------------------------------

    @Override
    public List<TaskStatVO> getOverdueTasks(Long projectId) {
        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        applyProjectFilter(wrapper, projectId);
        wrapper.eq(Task::getIsOverdue, true)
               .ne(Task::getStatus, 4) // not completed
               .ne(Task::getStatus, 5) // not cancelled
               .orderByDesc(Task::getDueDate);

        return toTaskStatVOList(taskMapper.selectList(wrapper));
    }

    // -----------------------------------------------------------------------
    //  Risks
    // -----------------------------------------------------------------------

    @Override
    public List<RiskStatVO> getRisks(Long projectId) {
        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        applyProjectFilter(wrapper, projectId);
        wrapper.eq(Task::getType, "RISK")
               .ne(Task::getStatus, 5) // not cancelled
               .orderByDesc(Task::getCreatedAt);

        return taskMapper.selectList(wrapper).stream()
                .map(this::toRiskStatVO)
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    //  Current tasks (in progress, due this week)
    // -----------------------------------------------------------------------

    @Override
    public List<TaskStatVO> getCurrentTasks(Long projectId) {
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));

        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        applyProjectFilter(wrapper, projectId);
        wrapper.eq(Task::getStatus, 2) // in_progress
               .ge(Task::getDueDate, startOfWeek)
               .le(Task::getDueDate, endOfWeek)
               .orderByAsc(Task::getDueDate);

        return toTaskStatVOList(taskMapper.selectList(wrapper));
    }

    // -----------------------------------------------------------------------
    //  Next tasks (due next week)
    // -----------------------------------------------------------------------

    @Override
    public List<TaskStatVO> getNextTasks(Long projectId) {
        LocalDate today = LocalDate.now();
        LocalDate nextMonday = today.with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        LocalDate nextSunday = nextMonday.with(TemporalAdjusters.next(DayOfWeek.SUNDAY));

        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        applyProjectFilter(wrapper, projectId);
        wrapper.ne(Task::getStatus, 4) // not completed
               .ne(Task::getStatus, 5) // not cancelled
               .ge(Task::getDueDate, nextMonday)
               .le(Task::getDueDate, nextSunday)
               .orderByAsc(Task::getDueDate);

        return toTaskStatVOList(taskMapper.selectList(wrapper));
    }

    // -----------------------------------------------------------------------
    //  Man-hour ranking (top 10)
    // -----------------------------------------------------------------------

    @Override
    public ManHourRankingVO getManHourRanking(Long projectId) {
        // Query all completed or in-progress tasks with actual hours
        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        applyProjectFilter(wrapper, projectId);
        wrapper.isNotNull(Task::getActualHours)
               .gt(Task::getActualHours, BigDecimal.ZERO)
               .isNotNull(Task::getAssigneeId);

        List<Task> tasks = taskMapper.selectList(wrapper);

        // Aggregate hours per user
        Map<Long, BigDecimal> hoursByUser = new LinkedHashMap<>();
        for (Task task : tasks) {
            hoursByUser.merge(task.getAssigneeId(), task.getActualHours(), BigDecimal::add);
        }

        // Sort by hours descending and take top 10
        List<Map.Entry<Long, BigDecimal>> sorted = hoursByUser.entrySet().stream()
                .sorted(Map.Entry.<Long, BigDecimal>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toList());

        // Build ranking items
        BigDecimal totalHours = sorted.stream()
                .map(Map.Entry::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<ManHourRankingItemVO> items = new ArrayList<>();
        List<PieChartDataVO> pieData = new ArrayList<>();

        int rank = 1;
        for (Map.Entry<Long, BigDecimal> entry : sorted) {
            Long userId = entry.getKey();
            BigDecimal hours = entry.getValue();
            User user = userMapper.selectById(userId);
            String userName = user != null ? user.getRealName() : "Unknown";

            // Ranking item
            ManHourRankingItemVO item = new ManHourRankingItemVO();
            item.setUserId(userId);
            item.setUserName(userName);
            item.setHours(hours.setScale(2, RoundingMode.HALF_UP));
            item.setRanking(rank++);
            items.add(item);

            // Pie chart data
            PieChartDataVO pie = new PieChartDataVO();
            pie.setName(userName);
            pie.setValue(hours.setScale(2, RoundingMode.HALF_UP));
            int percent = totalHours.compareTo(BigDecimal.ZERO) > 0
                    ? hours.multiply(BigDecimal.valueOf(100))
                          .divide(totalHours, 0, RoundingMode.HALF_UP)
                          .intValue()
                    : 0;
            pie.setPercent(percent);
            pieData.add(pie);
        }

        ManHourRankingVO vo = new ManHourRankingVO();
        vo.setItems(items);
        vo.setPieData(pieData);
        return vo;
    }

    // -----------------------------------------------------------------------
    //  On-time rate ranking
    // -----------------------------------------------------------------------

    @Override
    public List<OnTimeRateVO> getOnTimeRateRanking(Long projectId) {
        // Query all completed tasks with a due date
        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        applyProjectFilter(wrapper, projectId);
        wrapper.eq(Task::getStatus, 4) // completed
               .isNotNull(Task::getDueDate)
               .isNotNull(Task::getAssigneeId);

        List<Task> completedTasks = taskMapper.selectList(wrapper);

        // Group by assignee
        Map<Long, List<Task>> tasksByUser = completedTasks.stream()
                .collect(Collectors.groupingBy(Task::getAssigneeId));

        // Calculate on-time rate per user
        List<OnTimeRateVO> result = new ArrayList<>();
        for (Map.Entry<Long, List<Task>> entry : tasksByUser.entrySet()) {
            Long userId = entry.getKey();
            List<Task> userTasks = entry.getValue();
            int total = userTasks.size();

            // Count on-time tasks: completed before or on due date
            long onTimeCount = userTasks.stream()
                    .filter(t -> {
                        LocalDate completedDate = t.getActualEnd();
                        if (completedDate == null && t.getUpdatedAt() != null) {
                            completedDate = t.getUpdatedAt().toLocalDate();
                        }
                        return completedDate != null && !completedDate.isAfter(t.getDueDate());
                    })
                    .count();

            User user = userMapper.selectById(userId);
            String userName = user != null ? user.getRealName() : "Unknown";

            OnTimeRateVO vo = new OnTimeRateVO();
            vo.setUserId(userId);
            vo.setUserName(userName);
            vo.setTotalTasks(total);
            vo.setOnTimeTasks((int) onTimeCount);
            BigDecimal rate = total > 0
                    ? BigDecimal.valueOf(onTimeCount * 100.0 / total).setScale(1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            vo.setRate(rate);
            result.add(vo);
        }

        // Sort by rate descending
        result.sort((a, b) -> b.getRate().compareTo(a.getRate()));
        return result;
    }

    // -----------------------------------------------------------------------
    //  In-progress activities
    // -----------------------------------------------------------------------

    @Override
    public List<TaskStatVO> getInProgressActivities(Long projectId) {
        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        applyProjectFilter(wrapper, projectId);
        wrapper.eq(Task::getType, "ACTIVITY")
               .eq(Task::getStatus, 2) // in_progress
               .orderByAsc(Task::getDueDate);

        return toTaskStatVOList(taskMapper.selectList(wrapper));
    }

    // -----------------------------------------------------------------------
    //  Summary
    // -----------------------------------------------------------------------

    @Override
    public DashboardSummaryVO getSummary() {
        DashboardSummaryVO vo = new DashboardSummaryVO();

        // Use count queries instead of loading all tasks into memory
        // Total active tasks (not cancelled)
        vo.setTotalTasks(taskMapper.selectCount(
                new LambdaQueryWrapper<Task>().ne(Task::getStatus, 5)));

        vo.setCompleted(taskMapper.selectCount(
                new LambdaQueryWrapper<Task>().eq(Task::getStatus, 4)));
        vo.setInProgress(taskMapper.selectCount(
                new LambdaQueryWrapper<Task>().eq(Task::getStatus, 2)));
        vo.setNotStarted(taskMapper.selectCount(
                new LambdaQueryWrapper<Task>().eq(Task::getStatus, 1)));
        vo.setPendingReview(taskMapper.selectCount(
                new LambdaQueryWrapper<Task>().eq(Task::getStatus, 3)));

        // Overdue: is_overdue = true and not completed/cancelled
        vo.setOverdue(taskMapper.selectCount(
                new LambdaQueryWrapper<Task>()
                        .eq(Task::getIsOverdue, true)
                        .ne(Task::getStatus, 4)
                        .ne(Task::getStatus, 5)));

        // Today and this week
        LocalDate today = LocalDate.now();
        LocalDate startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endOfWeek = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        vo.setTodayTasks(taskMapper.selectCount(
                new LambdaQueryWrapper<Task>()
                        .eq(Task::getDueDate, today)
                        .ne(Task::getStatus, 4)
                        .ne(Task::getStatus, 5)));
        vo.setWeekTasks(taskMapper.selectCount(
                new LambdaQueryWrapper<Task>()
                        .ge(Task::getDueDate, startOfWeek)
                        .le(Task::getDueDate, endOfWeek)
                        .ne(Task::getStatus, 4)
                        .ne(Task::getStatus, 5)));

        // Warnings
        vo.setWarnings(taskMapper.selectCount(
                new LambdaQueryWrapper<Task>()
                        .eq(Task::getIsWarning, true)
                        .ne(Task::getStatus, 4)
                        .ne(Task::getStatus, 5)));

        // Risks and Suggestions by type
        vo.setRisks(taskMapper.selectCount(
                new LambdaQueryWrapper<Task>()
                        .eq(Task::getType, "RISK")
                        .ne(Task::getStatus, 5)));
        vo.setSuggestions(taskMapper.selectCount(
                new LambdaQueryWrapper<Task>()
                        .eq(Task::getType, "SUGGESTION")
                        .ne(Task::getStatus, 5)));

        return vo;
    }

    // -----------------------------------------------------------------------
    //  Project progress
    // -----------------------------------------------------------------------

    @Override
    public List<ProjectProgressVO> getProjectProgress() {
        LambdaQueryWrapper<Project> wrapper = new LambdaQueryWrapper<>();
        wrapper.isNull(Project::getDeletedAt)
               .in(Project::getStatus, 1, 2, 4); // not_started, in_progress, delayed

        return projectMapper.selectList(wrapper).stream()
                .map(p -> {
                    ProjectProgressVO vo = new ProjectProgressVO();
                    vo.setId(p.getId());
                    vo.setName(p.getName());
                    vo.setProgress(p.getProgress() != null ? p.getProgress() : 0);
                    vo.setStatus(resolveProjectStatus(p.getStatus()));
                    vo.setDueDate(p.getPlannedEnd());
                    return vo;
                })
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    //  Upcoming milestones (next 30 days)
    // -----------------------------------------------------------------------

    @Override
    public List<UpcomingMilestoneVO> getUpcomingMilestones() {
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysLater = today.plusDays(30);

        LambdaQueryWrapper<Milestone> wrapper = new LambdaQueryWrapper<>();
        wrapper.ge(Milestone::getPlannedDate, today)
               .le(Milestone::getPlannedDate, thirtyDaysLater)
               .ne(Milestone::getStatus, 3) // not already completed
               .orderByAsc(Milestone::getPlannedDate);

        return milestoneMapper.selectList(wrapper).stream()
                .collect(Collectors.collectingAndThen(Collectors.toList(), milestones -> {
                    // Batch-fetch projects to avoid N+1
                    Set<Long> projectIds = milestones.stream()
                            .map(Milestone::getProjectId).filter(Objects::nonNull).collect(Collectors.toSet());
                    Map<Long, Project> projectMap = projectIds.isEmpty() ? Collections.emptyMap()
                            : projectMapper.selectBatchIds(projectIds).stream()
                                .collect(Collectors.toMap(Project::getId, p -> p));

                    return milestones.stream().map(m -> {
                        UpcomingMilestoneVO vo = new UpcomingMilestoneVO();
                        vo.setId(m.getId());
                        vo.setName(m.getName());
                        vo.setPlannedDate(m.getPlannedDate());
                        vo.setStatus(resolveMilestoneStatus(m.getStatus()));
                        vo.setDaysRemaining((int) java.time.temporal.ChronoUnit.DAYS.between(today, m.getPlannedDate()));
                        if (m.getProjectId() != null) {
                            Project project = projectMap.get(m.getProjectId());
                            if (project != null) vo.setProjectName(project.getName());
                        }
                        return vo;
                    }).collect(Collectors.toList());
                }));
    }

    // -----------------------------------------------------------------------
    //  Pending approvals
    // -----------------------------------------------------------------------

    @Override
    public List<ApprovalTaskVO> getPendingApprovals(Long userId) {
        return workflowService.getPendingTasks(userId);
    }

    // -----------------------------------------------------------------------
    //  Warnings (is_warning = true)
    // -----------------------------------------------------------------------

    @Override
    public List<TaskStatVO> getWarnings() {
        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Task::getIsWarning, true)
               .ne(Task::getStatus, 4) // not completed
               .ne(Task::getStatus, 5) // not cancelled
               .orderByAsc(Task::getDueDate);

        return toTaskStatVOList(taskMapper.selectList(wrapper));
    }

    // -----------------------------------------------------------------------
    //  Suggestions (type = SUGGESTION)
    // -----------------------------------------------------------------------

    @Override
    public List<TaskStatVO> getSuggestions() {
        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Task::getType, "SUGGESTION")
               .ne(Task::getStatus, 5) // not cancelled
               .orderByDesc(Task::getCreatedAt);

        return toTaskStatVOList(taskMapper.selectList(wrapper));
    }

    // -----------------------------------------------------------------------
    //  Overview (combined project + task stats)
    // -----------------------------------------------------------------------

    @Override
    public DashboardOverviewVO getOverview() {
        DashboardOverviewVO vo = new DashboardOverviewVO();

        // Project counts
        LambdaQueryWrapper<Project> projectWrapper = new LambdaQueryWrapper<>();
        projectWrapper.isNull(Project::getDeletedAt);
        List<Project> projects = projectMapper.selectList(projectWrapper);
        vo.setTotalProjects(projects.size());
        vo.setInProgress(projects.stream().filter(p -> p.getStatus() != null && p.getStatus() == 2).count());
        vo.setCompleted(projects.stream().filter(p -> p.getStatus() != null && p.getStatus() == 3).count());
        vo.setDelayed(projects.stream().filter(p -> p.getStatus() != null && p.getStatus() == 4).count());

        // Task counts (reuse getSummary for efficiency)
        DashboardSummaryVO summary = getSummary();
        vo.setTotalTasks(summary.getTotalTasks());
        vo.setCompletedTasks(summary.getCompleted());
        vo.setInProgressTasks(summary.getInProgress());
        vo.setOverdueTasks(summary.getOverdue());

        return vo;
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    /**
     * Apply optional project filter to a query wrapper.
     */
    private void applyProjectFilter(LambdaQueryWrapper<Task> wrapper, Long projectId) {
        if (projectId != null) {
            wrapper.eq(Task::getProjectId, projectId);
        }
    }

    /**
     * Resolve status integer to a readable label.
     */
    private String resolveStatusLabel(Integer status) {
        if (status == null) return "unknown";
        return switch (status) {
            case 1 -> "pending";
            case 2 -> "in_progress";
            case 3 -> "pending_review";
            case 4 -> "completed";
            case 5 -> "cancelled";
            default -> "unknown";
        };
    }

    /**
     * Resolve project status integer to a readable label.
     */
    private String resolveProjectStatus(Integer status) {
        if (status == null) return "not_started";
        return switch (status) {
            case 1 -> "not_started";
            case 2 -> "in_progress";
            case 3 -> "completed";
            case 4 -> "delayed";
            case 0 -> "cancelled";
            default -> "not_started";
        };
    }

    /**
     * Resolve milestone status integer to a readable label.
     */
    private String resolveMilestoneStatus(Integer status) {
        if (status == null) return "not_started";
        return switch (status) {
            case 1 -> "not_started";
            case 2 -> "in_progress";
            case 3 -> "completed";
            case 4 -> "delayed";
            default -> "not_started";
        };
    }

    /**
     * Convert a Task entity to TaskStatVO with enriched display names.
     */
    private TaskStatVO toTaskStatVO(Task task) {
        return toTaskStatVO(task, null, null);
    }

    private TaskStatVO toTaskStatVO(Task task, Map<Long, Project> projectMap, Map<Long, User> userMap) {
        TaskStatVO vo = new TaskStatVO();
        vo.setTaskId(task.getId());
        vo.setTaskNo(task.getTaskNo());
        vo.setTitle(task.getTitle());
        vo.setStatus(resolveStatusLabel(task.getStatus()));
        vo.setDueDate(task.getDueDate());
        vo.setType(task.getType());
        vo.setActualHours(task.getActualHours());
        vo.setPlannedHours(task.getPlannedHours());

        // Use actualEnd as completedAt for completed tasks
        if (task.getStatus() != null && task.getStatus() == 4) {
            if (task.getActualEnd() != null) {
                vo.setCompletedAt(task.getActualEnd().atTime(LocalTime.MAX));
            } else {
                vo.setCompletedAt(task.getUpdatedAt());
            }
        }

        // Enrich project name (batch or single)
        if (task.getProjectId() != null) {
            if (projectMap != null) {
                Project project = projectMap.get(task.getProjectId());
                if (project != null) vo.setProjectName(project.getName());
            } else {
                Project project = projectMapper.selectById(task.getProjectId());
                if (project != null) vo.setProjectName(project.getName());
            }
        }

        // Enrich assignee name (batch or single)
        if (task.getAssigneeId() != null) {
            if (userMap != null) {
                User user = userMap.get(task.getAssigneeId());
                if (user != null) vo.setAssigneeName(user.getRealName());
            } else {
                User user = userMapper.selectById(task.getAssigneeId());
                if (user != null) vo.setAssigneeName(user.getRealName());
            }
        }

        return vo;
    }

    /**
     * Batch-enrich a list of tasks: pre-fetch projects and users, then convert.
     */
    private List<TaskStatVO> toTaskStatVOList(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) return Collections.emptyList();

        Set<Long> projectIds = tasks.stream()
                .map(Task::getProjectId).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> userIds = tasks.stream()
                .map(Task::getAssigneeId).filter(Objects::nonNull).collect(Collectors.toSet());

        Map<Long, Project> projectMap = projectIds.isEmpty() ? Collections.emptyMap()
                : projectMapper.selectBatchIds(projectIds).stream()
                    .collect(Collectors.toMap(Project::getId, p -> p));
        Map<Long, User> userMap = userIds.isEmpty() ? Collections.emptyMap()
                : userMapper.selectBatchIds(userIds).stream()
                    .collect(Collectors.toMap(User::getId, u -> u));

        return tasks.stream()
                .map(t -> toTaskStatVO(t, projectMap, userMap))
                .collect(Collectors.toList());
    }

    /**
     * Convert a Task entity to RiskStatVO with enriched display names.
     */
    private RiskStatVO toRiskStatVO(Task task) {
        RiskStatVO vo = new RiskStatVO();
        vo.setTaskId(task.getId());
        vo.setTitle(task.getTitle());
        vo.setDescription(task.getDescription());

        // Derive risk level from tags
        if (task.getTags() != null) {
            String[] tags = task.getTags().split(",");
            for (String tag : tags) {
                String trimmed = tag.trim().toLowerCase();
                if ("high".equals(trimmed) || "medium".equals(trimmed) || "low".equals(trimmed)) {
                    vo.setRiskLevel(trimmed);
                    break;
                }
            }
        }
        if (vo.getRiskLevel() == null) {
            vo.setRiskLevel("medium");
        }

        // Enrich project name
        if (task.getProjectId() != null) {
            Project project = projectMapper.selectById(task.getProjectId());
            if (project != null) {
                vo.setProjectName(project.getName());
            }
        }

        return vo;
    }
}
