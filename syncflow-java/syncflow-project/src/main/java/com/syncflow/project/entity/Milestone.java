package com.syncflow.project.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Milestones, deliverables, and review points within projects.
 * Maps to table {@code prj_milestone}.
 */
@Data
@TableName("prj_milestone")
public class Milestone implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** Primary key, auto-increment (BIGSERIAL). */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** FK to prj_project.id. */
    private Long projectId;

    /** FK to prj_phase.id, NULL if cross-phase. */
    private Long phaseId;

    /** Milestone display name. */
    private String name;

    /** Type: MILESTONE, DELIVERABLE, or REVIEW. */
    private String type;

    /**
     * Milestone status.
     * <ul>
     *   <li>1 = not_started</li>
     *   <li>2 = in_progress</li>
     *   <li>3 = completed</li>
     *   <li>4 = delayed</li>
     * </ul>
     */
    private Integer status;

    /** Completion percentage 0-100. */
    private Integer progress;

    /** Target completion date. */
    private LocalDate plannedDate;

    /** Actual completion date. */
    private LocalDate actualDate;

    /** FK to sys_user.id, responsible person. */
    private Long assigneeId;

    /** Description of the deliverable or acceptance criteria. */
    private String deliverable;

    /** FK to prj_milestone.id for hierarchical milestones. */
    private Long parentMilestoneId;

    /** Workflow engine instance identifier. */
    private String flowInstanceId;

    /** Workflow task identifier. */
    private String taskId;

    /** Row creation timestamp (auto-filled on insert). */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** Row last-update timestamp (auto-filled on insert and update). */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
