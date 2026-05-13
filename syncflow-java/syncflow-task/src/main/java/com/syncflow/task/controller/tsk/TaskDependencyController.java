package com.syncflow.task.controller.tsk;

import com.syncflow.common.result.Result;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.task.entity.TaskDependency;
import com.syncflow.task.service.TaskDependencyService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Task dependency management (SS/SF/FS/FF).
 */
@RestController
@RequestMapping("/api/tasks/{taskId}/dependencies")
public class TaskDependencyController {

    private final TaskDependencyService dependencyService;

    public TaskDependencyController(TaskDependencyService dependencyService) {
        this.dependencyService = dependencyService;
    }

    @GetMapping
    public Result<List<TaskDependency>> getDependencies(@PathVariable Long taskId) {
        return Result.success(dependencyService.getDependenciesByTask(taskId));
    }

    @PostMapping
    public Result<TaskDependency> createDependency(
            @PathVariable Long taskId,
            @RequestBody CreateDependencyRequest request) {
        Long userId = SecurityUtils.tryGetUserId();
        TaskDependency dep = dependencyService.createDependency(
                taskId, request.getDependsOnTaskId(), request.getDependencyType(), userId);
        return Result.success(dep);
    }

    @PutMapping("/{depId}")
    public Result<TaskDependency> updateDependencyType(
            @PathVariable Long taskId,
            @PathVariable Long depId,
            @RequestBody UpdateDependencyRequest request) {
        TaskDependency dep = dependencyService.updateDependencyType(depId, request.getDependencyType());
        return Result.success(dep);
    }

    @DeleteMapping("/{depId}")
    public Result<Void> deleteDependency(
            @PathVariable Long taskId,
            @PathVariable Long depId) {
        Long userId = SecurityUtils.tryGetUserId();
        dependencyService.deleteDependency(depId, userId);
        return Result.success(null);
    }

    // --- Request DTOs ---

    @lombok.Data
    public static class CreateDependencyRequest {
        private Long dependsOnTaskId;
        private String dependencyType;
    }

    @lombok.Data
    public static class UpdateDependencyRequest {
        private String dependencyType;
    }
}
