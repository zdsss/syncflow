package com.syncflow.task.controller.tsk;

import com.syncflow.common.result.Result;
import com.syncflow.task.entity.Task;
import com.syncflow.task.service.CascadeScheduleService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Cascade scheduling and timeline endpoints.
 */
@RestController
@RequestMapping("/api/tasks")
public class TaskScheduleController {

    private final CascadeScheduleService cascadeService;

    public TaskScheduleController(CascadeScheduleService cascadeService) {
        this.cascadeService = cascadeService;
    }

    /**
     * Update task dates with optional cascade to dependent tasks.
     */
    @PutMapping("/{id}/schedule")
    public Result<Void> updateSchedule(
            @PathVariable Long id,
            @RequestBody ScheduleRequest request) {
        if (Boolean.TRUE.equals(request.getCascade())) {
            cascadeService.cascadeSchedule(id, request.getPlannedStart(), request.getPlannedEnd());
        } else {
            cascadeService.updateSchedule(id, request.getPlannedStart(), request.getPlannedEnd());
        }
        return Result.success(null);
    }

    /**
     * Preview cascade impact without actually saving changes.
     */
    @PostMapping("/{id}/cascade-preview")
    public Result<List<Task>> previewCascade(
            @PathVariable Long id,
            @RequestBody ScheduleRequest request) {
        List<Task> affected = cascadeService.previewCascade(
                id, request.getPlannedStart(), request.getPlannedEnd());
        return Result.success(affected);
    }

    @lombok.Data
    public static class ScheduleRequest {
        private LocalDate plannedStart;
        private LocalDate plannedEnd;
        private Boolean cascade;
    }
}
