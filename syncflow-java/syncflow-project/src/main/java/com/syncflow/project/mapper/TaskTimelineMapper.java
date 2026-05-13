package com.syncflow.project.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * Lightweight mapper for querying task data for timeline rendering.
 * Avoids a full dependency on the task module by querying the {@code tsk_task} table directly.
 * <p>
 * Follows the same cross-module pattern as {@link TaskGanttMapper}.
 */
@Mapper
public interface TaskTimelineMapper {

    /**
     * Select task status and date information for timeline segment computation.
     *
     * @param projectId the project ID to query tasks for
     * @return list of maps containing task status, plannedStart, and plannedEnd
     */
    @Select("SELECT status, planned_start, planned_end " +
            "FROM tsk_task " +
            "WHERE project_id = #{projectId} AND deleted_at IS NULL " +
            "ORDER BY planned_start")
    List<Map<String, Object>> selectTaskTimelines(@Param("projectId") Long projectId);

    /**
     * Select a single task's timeline data by task ID.
     *
     * @param taskId the task ID
     * @return map containing task status, plannedStart, and plannedEnd, or null if not found
     */
    @Select("SELECT id, status, planned_start, planned_end " +
            "FROM tsk_task " +
            "WHERE id = #{taskId} AND deleted_at IS NULL")
    Map<String, Object> selectTaskTimeline(@Param("taskId") Long taskId);
}
