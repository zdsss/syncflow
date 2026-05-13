package com.syncflow.project.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Gate review (DQR, TR, QG) between project phases.
 * Maps to table {@code prj_stage_gate}.
 */
@Data
@TableName("prj_stage_gate")
public class StageGate implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** Primary key, auto-increment (BIGSERIAL). */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** FK to prj_phase.id. */
    private Long phaseId;

    /** Gate display name. */
    private String name;

    /** Gate type code: DQR, TR, QG, etc. */
    private String gateType;

    /**
     * Gate status.
     * <ul>
     *   <li>1 = pending</li>
     *   <li>2 = approved</li>
     *   <li>3 = rejected</li>
     * </ul>
     */
    private Integer status;

    /** Workflow engine instance identifier. */
    private String flowInstanceId;

    /** Workflow task identifier. */
    private String taskId;

    /** FK to sys_user.id who approved/rejected. */
    private Long approverId;

    /** Timestamp when gate was approved or rejected. */
    private LocalDateTime approvedAt;

    /** Reviewer comments. */
    private String comments;

    /** Row creation timestamp (auto-filled on insert). */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** Row last-update timestamp (auto-filled on insert and update). */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
