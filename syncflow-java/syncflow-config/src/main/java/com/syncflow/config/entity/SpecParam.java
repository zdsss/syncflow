package com.syncflow.config.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Spec parameter entity.
 * Maps to the {@code cfg_spec_param} table.
 */
@Data
@TableName("cfg_spec_param")
public class SpecParam {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to cfg_module_spec.id. */
    private Long specId;

    /** Parameter name. */
    private String paramName;

    /** Parameter data type (e.g. STRING, NUMBER, BOOLEAN, ENUM). */
    private String paramType;

    /** UI control type (e.g. INPUT, SELECT, RADIO, CHECKBOX, SLIDER). */
    private String controlType;

    /** Default value as string. */
    private String defaultValue;

    /** JSON array of options for SELECT/RADIO/CHECKBOX controls. */
    private String options;

    /** Minimum allowed value (for numeric parameters). */
    private BigDecimal minValue;

    /** Maximum allowed value (for numeric parameters). */
    private BigDecimal maxValue;

    /** Unit of measurement (e.g. mm, kg, MPa). */
    private String unit;

    /** Display order within the spec. */
    private Integer sortOrder;

    /** Whether this parameter is mandatory. */
    private Boolean isRequired;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
