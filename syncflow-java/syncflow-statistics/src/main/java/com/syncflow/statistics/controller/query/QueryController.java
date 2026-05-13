package com.syncflow.statistics.controller.query;

import com.syncflow.common.result.Result;
import com.syncflow.statistics.dto.query.*;
import com.syncflow.statistics.service.query.QueryService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Query / statistics controller for cross-cutting queries.
 */
@RestController
@RequestMapping("/api/query")
public class QueryController {

    private final QueryService queryService;

    public QueryController(QueryService queryService) {
        this.queryService = queryService;
    }

    /**
     * Get task statistics.
     */
    @GetMapping("/task-stats")
    public Result<TaskStatsVO> getTaskStats(
            @RequestParam(required = false) Long projectId) {
        TaskStatsVO vo = queryService.getTaskStats(projectId);
        return Result.success(vo);
    }

    /**
     * Get project statistics.
     */
    @GetMapping("/project-stats")
    public Result<ProjectStatsVO> getProjectStats() {
        ProjectStatsVO vo = queryService.getProjectStats();
        return Result.success(vo);
    }

    /**
     * Get overdue tasks.
     */
    @GetMapping("/overdue-tasks")
    public Result<List<OverdueTaskVO>> getOverdueTasks(
            @RequestParam(required = false) Long projectId) {
        List<OverdueTaskVO> result = queryService.getOverdueTasks(projectId);
        return Result.success(result);
    }

    /**
     * Get project progress.
     */
    @GetMapping("/project-progress/{projectId}")
    public Result<ProjectProgressVO> getProjectProgress(@PathVariable Long projectId) {
        ProjectProgressVO vo = queryService.getProjectProgress(projectId);
        return Result.success(vo);
    }

    /**
     * Get user workload.
     */
    @GetMapping("/user-workload/{userId}")
    public Result<UserWorkloadVO> getUserWorkload(@PathVariable Long userId) {
        UserWorkloadVO vo = queryService.getUserWorkload(userId);
        return Result.success(vo);
    }

    /**
     * Get department statistics.
     */
    @GetMapping("/department-stats/{departmentId}")
    public Result<DepartmentStatsVO> getDepartmentStats(@PathVariable Long departmentId) {
        DepartmentStatsVO vo = queryService.getDepartmentStats(departmentId);
        return Result.success(vo);
    }

    /**
     * Export tasks as CSV.
     */
    @GetMapping("/export/tasks")
    public ResponseEntity<byte[]> exportTasks(
            @RequestParam(required = false) Long projectId) {
        String csv = queryService.exportTasks(projectId);
        byte[] bytes = csv.getBytes();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=tasks.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .contentLength(bytes.length)
                .body(bytes);
    }

    /**
     * Export projects as CSV.
     */
    @GetMapping("/export/projects")
    public ResponseEntity<byte[]> exportProjects() {
        String csv = queryService.exportProjects();
        byte[] bytes = csv.getBytes();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=projects.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .contentLength(bytes.length)
                .body(bytes);
    }
}
