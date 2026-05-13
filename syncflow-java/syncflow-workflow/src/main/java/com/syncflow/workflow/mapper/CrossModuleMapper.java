package com.syncflow.workflow.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * Lightweight mapper for cross-module queries.
 * <p>
 * The workflow module needs to resolve approval assignees from tables owned by
 * other modules (e.g. prj_project_member, sys_user). This mapper provides
 * direct SQL queries to avoid creating inter-module Java dependencies.
 */
@Mapper
public interface CrossModuleMapper {

    /**
     * Find user ids by project role.
     *
     * @param projectId the project id
     * @param role      the role code (e.g. PM, TECH_LEAD)
     * @return list of matching user ids
     */
    @Select("SELECT user_id FROM prj_project_member WHERE project_id = #{projectId} AND project_role = #{role} AND deleted_at IS NULL")
    List<Long> selectUsersByProjectRole(@Param("projectId") Long projectId, @Param("role") String role);

    /**
     * Look up a user's real name by id.
     *
     * @param userId the user id
     * @return realName, or {@code null} if not found
     */
    @Select("SELECT real_name FROM sys_user WHERE id = #{userId} AND status = 1 LIMIT 1")
    String selectUserRealName(@Param("userId") Long userId);

    /**
     * Find the department head user id for a given user's department.
     * Uses the {@code leader_id} column added in V16 migration.
     *
     * @param userId the user id whose department to look up
     * @return the department head user id, or {@code null} if not found
     */
    @Select("SELECT d.leader_id FROM sys_department d " +
            "JOIN sys_user u ON u.dept_id = d.id " +
            "WHERE u.id = #{userId} AND u.status = 1 AND d.leader_id IS NOT NULL LIMIT 1")
    Long selectDepartmentHead(@Param("userId") Long userId);

    /**
     * Find user ids in a specific department.
     *
     * @param deptId the department id
     * @return list of user ids in that department
     */
    @Select("SELECT id FROM sys_user WHERE dept_id = #{deptId} AND status = 1")
    List<Long> selectUsersByDepartment(@Param("deptId") Long deptId);
}
