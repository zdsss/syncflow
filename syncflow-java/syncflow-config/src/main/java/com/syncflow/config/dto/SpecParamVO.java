package com.syncflow.config.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Spec parameter view object.
 */
@Data
public class SpecParamVO {

    private Long id;

    private String paramName;

    private String paramType;

    private String controlType;

    private String defaultValue;

    private String options;

    private BigDecimal minValue;

    private BigDecimal maxValue;

    private String unit;

    private Boolean isRequired;
}
