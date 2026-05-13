package com.syncflow.project.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * View object for project team member display.
 */
@Data
public class ProjectMemberVO {

    private Long id;

    /** FK to sys_user.id. */
    private Long userId;

    /** Resolved user display name. */
    private String userName;

    /** Role within the project: PM, ENGINEER, TESTER, OBSERVER. */
    private String projectRole;

    /** FK to sys_department.id. */
    private Long deptId;

    /** Resolved department name. */
    private String deptName;

    /** Timestamp when user joined the project. */
    private LocalDateTime joinedAt;
}
