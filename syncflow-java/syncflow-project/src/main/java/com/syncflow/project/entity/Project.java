package com.syncflow.project.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Core project entity for industrial project management.
 * Maps to table {@code prj_project}.
 */
@Data
@TableName("prj_project")
public class Project implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** Primary key, auto-increment (BIGSERIAL). */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** Project display name. */
    private String name;

    /** Unique project code for programmatic reference. */
    private String code;

    /** Rich-text project description. */
    private String description;

    /** FK to sys_user.id, project owner / manager. */
    private Long ownerId;

    /** Project classification: R&D, PRODUCTION, MAINTENANCE, etc. */
    private String projectType;

    /**
     * Project status.
     * <ul>
     *   <li>1 = not_started</li>
     *   <li>2 = in_progress</li>
     *   <li>3 = completed</li>
     *   <li>4 = delayed</li>
     *   <li>0 = cancelled</li>
     * </ul>
     */
    private Integer status;

    /**
     * Priority level.
     * <ul>
     *   <li>1 = urgent</li>
     *   <li>2 = high</li>
     *   <li>3 = medium</li>
     *   <li>4 = low</li>
     * </ul>
     */
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

    /** FK to prj_project.id for sub-projects. */
    private Long parentId;

    /** Materialised ancestor path for fast tree queries. */
    private String parentPath;

    /** FK to sys_department.id, owning department. */
    private Long deptId;

    /** Workflow engine instance identifier. */
    private String flowInstanceId;

    /** Tenant identifier for multi-tenancy. */
    private Long tenantId;

    /** Row creation timestamp (auto-filled on insert). */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** Row last-update timestamp (auto-filled on insert and update). */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /** Soft-delete timestamp, NULL means not deleted. */
    @TableLogic
    private LocalDateTime deletedAt;
}
