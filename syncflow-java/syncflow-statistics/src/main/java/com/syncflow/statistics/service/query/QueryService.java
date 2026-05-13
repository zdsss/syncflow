package com.syncflow.statistics.service.query;

import com.syncflow.statistics.dto.query.*;

import java.util.List;

/**
 * Query / statistics service interface for cross-cutting queries.
 */
public interface QueryService {

    /**
     * Get task statistics across all projects.
     */
    TaskStatsVO getTaskStats(Long projectId);

    /**
     * Get project statistics.
     */
    ProjectStatsVO getProjectStats();

    /**
     * Get overdue tasks list.
     */
    List<OverdueTaskVO> getOverdueTasks(Long projectId);

    /**
     * Get project progress.
     */
    ProjectProgressVO getProjectProgress(Long projectId);

    /**
     * Get user workload summary.
     */
    UserWorkloadVO getUserWorkload(Long userId);

    /**
     * Get department statistics.
     */
    DepartmentStatsVO getDepartmentStats(Long departmentId);

    /**
     * Export tasks as CSV string.
     */
    String exportTasks(Long projectId);

    /**
     * Export projects as CSV string.
     */
    String exportProjects();
}
