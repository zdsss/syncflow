package com.syncflow.project.service;

import com.syncflow.project.vo.TimelineVO;

/**
 * Service for computing timeline views of projects and tasks.
 * <p>
 * Provides visual timeline data with color-coded segments for Gantt-style rendering.
 */
public interface TimelineService {

    /**
     * Compute the timeline for a project, including aggregated task segments.
     *
     * @param projectId the project ID
     * @return timeline VO with segments derived from project tasks
     * @throws com.syncflow.common.exception.BusinessException if the project is not found
     */
    TimelineVO getProjectTimeline(Long projectId);

    /**
     * Compute the timeline for a single task.
     *
     * @param taskId the task ID
     * @return timeline VO with a single segment for the task
     * @throws com.syncflow.common.exception.BusinessException if the task is not found
     */
    TimelineVO getTaskTimeline(Long taskId);
}
