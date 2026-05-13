package com.syncflow.project.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * View object for project display, supports tree structure with children.
 */
@Data
public class ProjectVO {

    private Long id;

    /** Project display name. */
    private String name;

    /** Unique project code. */
    private String code;

    /** Rich-text project description. */
    private String description;

    /** FK to sys_user.id. */
    private Long ownerId;

    /** Resolved owner display name. */
    private String ownerName;

    /** Project classification. */
    private String projectType;

    /** Status code: 1=not_started, 2=in_progress, 3=completed, 4=delayed, 0=cancelled. */
    private Integer status;

    /** Priority level: 1=urgent, 2=high, 3=medium, 4=low. */
    private Integer priority;

    /** Completion percentage 0-100. */
    private Integer progress;

    /** Planned project start date. */
    private LocalDate plannedStart;

    /** Planned project end date. */
    private LocalDate plannedEnd;

    /** Actual project start date. */
    private LocalDate actualStart;

    /** Actual project end date. */
    private LocalDate actualEnd;

    /** FK to parent project id. */
    private Long parentId;

    /** Materialised ancestor path. */
    private String parentPath;

    /** FK to owning department. */
    private Long deptId;

    /** Workflow engine instance identifier. */
    private String flowInstanceId;

    /** Tenant identifier. */
    private Long tenantId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /** Child projects for tree rendering. */
    private List<ProjectVO> children;
}
