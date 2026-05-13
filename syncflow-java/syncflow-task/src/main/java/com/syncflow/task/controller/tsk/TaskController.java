package com.syncflow.task.controller.tsk;

import com.syncflow.common.result.PageResult;
import com.syncflow.common.result.Result;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.task.dto.*;
import com.syncflow.task.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Task management controller.
 */
@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    /**
     * Paginated task list with dynamic filters.
     */
    @GetMapping
    public Result<PageResult<TaskListVO>> getTaskList(
            TaskQueryDTO query,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<TaskListVO> result = taskService.getTaskList(query, pageNum, pageSize);
        return Result.success(result);
    }

    /**
     * Dashboard task statistics.
     */
    @GetMapping("/statistics")
    public Result<TaskStatisticsVO> getTaskStatistics(
            @RequestParam(required = false) Long userId) {
        // Default to current user if not specified
        if (userId == null) {
            userId = SecurityUtils.tryGetUserId();
        }
        TaskStatisticsVO stats = taskService.getTaskStatistics(userId);
        return Result.success(stats);
    }

    /**
     * Task detail.
     */
    @GetMapping("/{id}")
    public Result<TaskVO> getTaskDetail(@PathVariable Long id) {
        TaskVO vo = taskService.getTaskDetail(id);
        return Result.success(vo);
    }

    /**
     * Create a new task.
     */
    @PostMapping
    public Result<TaskVO> createTask(@Valid @RequestBody CreateTaskDTO dto) {
        TaskVO vo = taskService.createTask(dto);
        return Result.success(vo);
    }

    /**
     * Quick-create a task from a compact string format.
     */
    @PostMapping("/quick")
    public Result<TaskVO> quickCreate(@RequestBody QuickTaskDTO dto) {
        TaskVO vo = taskService.quickCreate(dto);
        return Result.success(vo);
    }

    /**
     * Update an existing task.
     */
    @PutMapping("/{id}")
    public Result<TaskVO> updateTask(@PathVariable Long id,
                                     @Valid @RequestBody CreateTaskDTO dto) {
        TaskVO vo = taskService.updateTask(id, dto);
        return Result.success(vo);
    }

    /**
     * Update task progress.
     */
    @PutMapping("/{id}/progress")
    public Result<Void> updateProgress(@PathVariable Long id,
                                       @RequestParam Integer progress) {
        taskService.updateProgress(id, progress);
        return Result.success();
    }

    /**
     * Mark a task as completed.
     */
    @PutMapping("/{id}/complete")
    public Result<Void> completeTask(@PathVariable Long id) {
        taskService.completeTask(id);
        return Result.success();
    }

    /**
     * Change a task's status with state machine validation.
     */
    @PutMapping("/{id}/status")
    public Result<Void> changeStatus(@PathVariable Long id,
                                     @Valid @RequestBody ChangeStatusDTO dto) {
        taskService.changeStatus(id, dto.getStatus());
        return Result.success();
    }

    /**
     * Delete a task (soft delete).
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return Result.success();
    }

    /**
     * Add a comment to a task.
     */
    @PostMapping("/{id}/comments")
    public Result<CommentVO> addComment(@PathVariable Long id,
                                        @Valid @RequestBody CreateCommentDTO dto) {
        CommentVO vo = taskService.addComment(id, dto);
        return Result.success(vo);
    }

    /**
     * Paginated comments for a task.
     */
    @GetMapping("/{id}/comments")
    public Result<PageResult<CommentVO>> getComments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<CommentVO> result = taskService.getComments(id, pageNum, pageSize);
        return Result.success(result);
    }

    /**
     * Activity audit trail for a task.
     */
    @GetMapping("/{id}/activities")
    public Result<List<TaskActivityVO>> getActivities(@PathVariable Long id) {
        List<TaskActivityVO> list = taskService.getActivities(id);
        return Result.success(list);
    }

    /**
     * Watch (subscribe to) a task.
     */
    @PostMapping("/{id}/watch")
    public Result<Void> watchTask(@PathVariable Long id) {
        Long userId = SecurityUtils.getUserId();
        taskService.watchTask(id, userId);
        return Result.success();
    }

    /**
     * Unwatch (unsubscribe from) a task.
     */
    @DeleteMapping("/{id}/watch")
    public Result<Void> unwatchTask(@PathVariable Long id) {
        Long userId = SecurityUtils.getUserId();
        taskService.unwatchTask(id, userId);
        return Result.success();
    }
}
