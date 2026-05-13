package com.syncflow.config.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Module specification entity.
 * Maps to the {@code cfg_module_spec} table.
 */
@Data
@TableName("cfg_module_spec")
public class ModuleSpec {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to cfg_module.id. */
    private Long moduleId;

    /** Specification name. */
    private String specName;

    /** Cross-section shape (e.g. rectangular, circular). */
    private String crossSection;

    /** Material type (e.g. steel, aluminum). */
    private String material;

    /** Wall thickness in mm. */
    private BigDecimal wallThickness;

    /** Connection type (e.g. flange, weld). */
    private String connectionType;

    /** Unique specification code. */
    private String specCode;

    /** Status: 0=draft, 1=published, 2=archived. */
    private Integer status;

    /** Workflow engine instance identifier (set on publish). */
    private String flowInstanceId;

    /** Timestamp when the spec was published. */
    private LocalDateTime releaseAt;

    /** FK to sys_user.id, creator of this spec. */
    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
