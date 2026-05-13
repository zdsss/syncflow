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
 * Project phase / stage within a project lifecycle.
 * Maps to table {@code prj_phase}.
 */
@Data
@TableName("prj_phase")
public class ProjectPhase implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** Primary key, auto-increment (BIGSERIAL). */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** FK to prj_project.id. */
    private Long projectId;

    /** Phase display name, e.g. CONCEPT, DESIGN, TESTING. */
    private String name;

    /** Phase code for programmatic reference. */
    private String code;

    /** Sequence number for ordering phases. */
    private Integer seqNo;

    /**
     * Phase status.
     * <ul>
     *   <li>1 = not_started</li>
     *   <li>2 = in_progress</li>
     *   <li>3 = completed</li>
     * </ul>
     */
    private Integer status;

    /** Completion percentage 0-100. */
    private Integer progress;

    /** Planned phase start date. */
    private LocalDate plannedStart;

    /** Planned phase end date. */
    private LocalDate plannedEnd;

    /** Actual phase start date. */
    private LocalDate actualStart;

    /** Actual phase end date. */
    private LocalDate actualEnd;

    /** Row creation timestamp (auto-filled on insert). */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /** Row last-update timestamp (auto-filled on insert and update). */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
