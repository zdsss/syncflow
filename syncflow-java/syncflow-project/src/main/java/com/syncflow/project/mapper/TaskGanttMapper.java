package com.syncflow.project.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * Lightweight mapper for querying task data for Gantt chart rendering.
 * Avoids a full dependency on the task module.
 */
@Mapper
public interface TaskGanttMapper {

    /**
     * Select tasks for a project with assignee name resolved via sys_user join.
     *
     * @param projectId the project id
     * @return list of task data maps for Gantt rendering
     */
    @Select("SELECT t.id, t.title, t.type, t.status, t.progress, " +
            "t.planned_start, t.planned_end, " +
            "t.assignee_id, t.phase_id, t.milestone_id, " +
            "u.real_name AS assignee_name " +
            "FROM tsk_task t LEFT JOIN sys_user u ON t.assignee_id = u.id " +
            "WHERE t.project_id = #{projectId} AND t.deleted_at IS NULL")
    List<Map<String, Object>> selectTasksForGantt(@Param("projectId") Long projectId);

    /**
     * Select task dependencies for a project's Gantt chart dependency lines.
     *
     * @param projectId the project id
     * @return list of dependency data maps with task_id, depends_on_task_id, dependency_type
     */
    @Select("SELECT d.task_id, d.depends_on_task_id, d.dependency_type " +
            "FROM tsk_task_dependency d " +
            "INNER JOIN tsk_task t ON d.task_id = t.id " +
            "WHERE t.project_id = #{projectId} AND t.deleted_at IS NULL")
    List<Map<String, Object>> selectDependenciesForGantt(@Param("projectId") Long projectId);

    @Select("SELECT COUNT(*) FROM tsk_task " +
            "WHERE project_id = #{projectId} AND deleted_at IS NULL " +
            "AND status NOT IN (4, 5)")
    long countActiveTasksByProject(@Param("projectId") Long projectId);

    @Select("SELECT COUNT(*) FROM wf_business_object " +
            "WHERE project_id = #{projectId} AND status = 2")
    long countPendingApprovalsByProject(@Param("projectId") Long projectId);
}
