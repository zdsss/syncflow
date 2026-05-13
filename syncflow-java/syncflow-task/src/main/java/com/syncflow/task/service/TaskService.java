package com.syncflow.task.service;

import com.syncflow.common.result.PageResult;
import com.syncflow.task.dto.*;

import java.util.List;

/**
 * Task management service interface.
 */
public interface TaskService {

    /**
     * Paginated task list with dynamic filters.
     */
    PageResult<TaskListVO> getTaskList(TaskQueryDTO query, int pageNum, int pageSize);

    /**
     * Dashboard statistics: counts by date range, warning, overdue, and type.
     */
    TaskStatisticsVO getTaskStatistics(Long userId);

    /**
     * Create a single task from structured input.
     */
    TaskVO createTask(CreateTaskDTO dto);

    /**
     * Quick-create a task by parsing a compact string format.
     * <p>
     * Format: {@code "任务名,@人#工时¥工期%类型"}
     */
    TaskVO quickCreate(QuickTaskDTO dto);

    /**
     * Update an existing task's fields.
     */
    TaskVO updateTask(Long id, CreateTaskDTO dto);

    /**
     * Update only the progress percentage of a task.
     */
    void updateProgress(Long id, Integer progress);

    /**
     * Mark a task as completed.
     */
    void completeTask(Long id);

    /**
     * Soft-delete a task.
     */
    void deleteTask(Long id);

    /**
     * Add a comment to a task.
     */
    CommentVO addComment(Long taskId, CreateCommentDTO dto);

    /**
     * Subscribe to task change notifications.
     */
    void watchTask(Long taskId, Long userId);

    /**
     * Unsubscribe from task change notifications.
     */
    void unwatchTask(Long taskId, Long userId);

    /**
     * Get full task detail with enriched display fields.
     */
    TaskVO getTaskDetail(Long id);

    /**
     * Change the status of a task with state machine validation.
     */
    void changeStatus(Long id, Integer newStatus);

    /**
     * Paginated comments for a task.
     */
    PageResult<CommentVO> getComments(Long taskId, int pageNum, int pageSize);

    /**
     * Activity audit trail for a task.
     */
    List<TaskActivityVO> getActivities(Long taskId);
}
