package com.syncflow.statistics.service.query.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.project.entity.Project;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.statistics.dto.query.*;
import com.syncflow.statistics.service.query.QueryService;
import com.syncflow.task.entity.Task;
import com.syncflow.task.mapper.TaskMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Query service implementation for cross-cutting statistics queries.
 */
@Service
@RequiredArgsConstructor
public class QueryServiceImpl implements QueryService {

    private final TaskMapper taskMapper;
    private final ProjectMapper projectMapper;

    @Override
    public TaskStatsVO getTaskStats(Long projectId) {
        LambdaQueryWrapper<Task> base = new LambdaQueryWrapper<>();
        if (projectId != null) {
            base.eq(Task::getProjectId, projectId);
        }

        long total = taskMapper.selectCount(base.clone());
        long completed = taskMapper.selectCount(base.clone().eq(Task::getStatus, 4));
        long overdue = taskMapper.selectCount(base.clone().eq(Task::getIsOverdue, true));
        long inProgress = taskMapper.selectCount(base.clone().eq(Task::getStatus, 2));
        long pending = taskMapper.selectCount(base.clone().eq(Task::getStatus, 1));

        Map<String, Long> byType = new HashMap<>();
        for (String type : List.of("TASK", "MILESTONE", "ISSUE", "RISK", "SUGGESTION", "CHANGE")) {
            long count = taskMapper.selectCount(
                    (projectId != null
                            ? new LambdaQueryWrapper<Task>().eq(Task::getProjectId, projectId)
                            : new LambdaQueryWrapper<Task>())
                            .eq(Task::getType, type));
            byType.put(type, count);
        }

        Map<String, Long> byPriority = new HashMap<>();
        for (int priority = 1; priority <= 4; priority++) {
            long count = taskMapper.selectCount(
                    (projectId != null
                            ? new LambdaQueryWrapper<Task>().eq(Task::getProjectId, projectId)
                            : new LambdaQueryWrapper<Task>())
                            .eq(Task::getPriority, priority));
            byPriority.put(String.valueOf(priority), count);
        }

        return TaskStatsVO.builder()
                .totalTasks(total)
                .completedTasks(completed)
                .overdueTasks(overdue)
                .inProgressTasks(inProgress)
                .pendingTasks(pending)
                .byType(byType)
                .byPriority(byPriority)
                .build();
    }

    @Override
    public ProjectStatsVO getProjectStats() {
        long total = projectMapper.selectCount(new LambdaQueryWrapper<>());
        long active = projectMapper.selectCount(
                new LambdaQueryWrapper<Project>().eq(Project::getStatus, 2));
        long completed = projectMapper.selectCount(
                new LambdaQueryWrapper<Project>().eq(Project::getStatus, 3));
        long delayed = projectMapper.selectCount(
                new LambdaQueryWrapper<Project>().eq(Project::getStatus, 4));

        Map<String, Long> byType = new HashMap<>();
        for (String type : List.of("R&D", "PRODUCTION", "MAINTENANCE")) {
            long count = projectMapper.selectCount(
                    new LambdaQueryWrapper<Project>().eq(Project::getProjectType, type));
            byType.put(type, count);
        }

        Map<String, Long> byDept = new HashMap<>();
        // Group by department
        List<Project> allProjects = projectMapper.selectList(new LambdaQueryWrapper<>());
        Map<Long, List<Project>> grouped = allProjects.stream()
                .filter(p -> p.getDeptId() != null)
                .collect(Collectors.groupingBy(Project::getDeptId));
        grouped.forEach((deptId, projects) -> byDept.put(String.valueOf(deptId), (long) projects.size()));

        return ProjectStatsVO.builder()
                .totalProjects(total)
                .activeProjects(active)
                .completedProjects(completed)
                .delayedProjects(delayed)
                .byType(byType)
                .byDepartment(byDept)
                .build();
    }

    @Override
    public List<OverdueTaskVO> getOverdueTasks(Long projectId) {
        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Task::getIsOverdue, true);
        if (projectId != null) {
            wrapper.eq(Task::getProjectId, projectId);
        }
        wrapper.last("LIMIT 100");

        List<Task> tasks = taskMapper.selectList(wrapper);
        return tasks.stream().map(task -> {
            String projectName = null;
            if (task.getProjectId() != null) {
                Project project = projectMapper.selectById(task.getProjectId());
                if (project != null) {
                    projectName = project.getName();
                }
            }
            return OverdueTaskVO.builder()
                    .taskId(task.getId())
                    .taskNo(task.getTaskNo())
                    .title(task.getTitle())
                    .projectName(projectName)
                    .dueDate(task.getDueDate())
                    .status(task.getStatus())
                    .progress(task.getProgress())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    public ProjectProgressVO getProjectProgress(Long projectId) {
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            return ProjectProgressVO.builder()
                    .projectId(projectId)
                    .progress(0)
                    .totalTasks(0)
                    .completedTasks(0)
                    .overdueTasks(0)
                    .build();
        }

        LambdaQueryWrapper<Task> taskWrapper = new LambdaQueryWrapper<>();
        taskWrapper.eq(Task::getProjectId, projectId);
        long totalTasks = taskMapper.selectCount(taskWrapper.clone()
                .ne(Task::getStatus, 6)); // exclude CANCELLED
        long completedTasks = taskMapper.selectCount(
                taskWrapper.clone().in(Task::getStatus, 3, 4)); // PENDING_REVIEW + COMPLETED (aligned with progress formula)
        long overdueTasks = taskMapper.selectCount(
                taskWrapper.clone().eq(Task::getIsOverdue, true));

        // Calculate sum of hours
        List<Task> allTasks = taskMapper.selectList(
                new LambdaQueryWrapper<Task>().eq(Task::getProjectId, projectId));
        BigDecimal plannedHours = allTasks.stream()
                .map(Task::getPlannedHours)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal actualHours = allTasks.stream()
                .map(Task::getActualHours)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return ProjectProgressVO.builder()
                .projectId(projectId)
                .projectName(project.getName())
                .progress(project.getProgress())
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .plannedHours(plannedHours)
                .actualHours(actualHours)
                .build();
    }

    @Override
    public UserWorkloadVO getUserWorkload(Long userId) {
        LambdaQueryWrapper<Task> base = new LambdaQueryWrapper<>();
        base.eq(Task::getAssigneeId, userId);

        long totalTasks = taskMapper.selectCount(base.clone());
        long completedTasks = taskMapper.selectCount(base.clone().eq(Task::getStatus, 4));
        long inProgressTasks = taskMapper.selectCount(base.clone().eq(Task::getStatus, 2));
        long overdueTasks = taskMapper.selectCount(base.clone().eq(Task::getIsOverdue, true));

        List<Task> userTasks = taskMapper.selectList(
                new LambdaQueryWrapper<Task>().eq(Task::getAssigneeId, userId));
        BigDecimal totalHours = userTasks.stream()
                .map(Task::getPlannedHours)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal actualHours = userTasks.stream()
                .map(Task::getActualHours)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return UserWorkloadVO.builder()
                .userId(userId)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .inProgressTasks(inProgressTasks)
                .overdueTasks(overdueTasks)
                .totalHours(totalHours)
                .actualHours(actualHours)
                .build();
    }

    @Override
    public DepartmentStatsVO getDepartmentStats(Long departmentId) {
        // Placeholder: in a real implementation, this would join with sys_department and sys_user
        return DepartmentStatsVO.builder()
                .departmentId(departmentId)
                .departmentName("Department " + departmentId)
                .totalMembers(0)
                .totalTasks(0)
                .completedTasks(0)
                .overdueTasks(0)
                .members(Collections.emptyList())
                .build();
    }

    @Override
    public String exportTasks(Long projectId) {
        LambdaQueryWrapper<Task> wrapper = new LambdaQueryWrapper<>();
        if (projectId != null) {
            wrapper.eq(Task::getProjectId, projectId);
        }
        wrapper.last("LIMIT 1000");

        List<Task> tasks = taskMapper.selectList(wrapper);
        StringBuilder sb = new StringBuilder();
        sb.append("ID,TaskNo,Title,Type,Status,Progress,AssigneeId,DueDate,IsOverdue\n");
        for (Task task : tasks) {
            sb.append(task.getId()).append(",")
              .append(task.getTaskNo()).append(",")
              .append(task.getTitle()).append(",")
              .append(task.getType()).append(",")
              .append(task.getStatus()).append(",")
              .append(task.getProgress()).append(",")
              .append(task.getAssigneeId()).append(",")
              .append(task.getDueDate()).append(",")
              .append(task.getIsOverdue()).append("\n");
        }
        return sb.toString();
    }

    @Override
    public String exportProjects() {
        List<Project> projects = projectMapper.selectList(new LambdaQueryWrapper<>());
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Name,Code,Status,Priority,Progress,OwnerId\n");
        for (Project project : projects) {
            sb.append(project.getId()).append(",")
              .append(project.getName()).append(",")
              .append(project.getCode()).append(",")
              .append(project.getStatus()).append(",")
              .append(project.getPriority()).append(",")
              .append(project.getProgress()).append(",")
              .append(project.getOwnerId()).append("\n");
        }
        return sb.toString();
    }
}
