package com.syncflow.project.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Project team membership, maps users to projects with roles.
 * Maps to table {@code prj_project_member}.
 */
@Data
@TableName("prj_project_member")
public class ProjectMember implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** Primary key, auto-increment (BIGSERIAL). */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** FK to prj_project.id. */
    private Long projectId;

    /** FK to sys_user.id. */
    private Long userId;

    /** Role within the project: PM, ENGINEER, TESTER, OBSERVER. */
    private String projectRole;

    /** FK to sys_department.id, member department at join time. */
    private Long deptId;

    /** Timestamp when user joined the project. */
    private LocalDateTime joinedAt;
}
