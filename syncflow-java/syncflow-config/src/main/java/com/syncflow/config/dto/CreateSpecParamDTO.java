package com.syncflow.config.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO for creating a new spec parameter.
 */
@Data
public class CreateSpecParamDTO {

    @NotBlank(message = "Parameter name is required")
    private String paramName;

    private String paramType;

    private String controlType;

    private String defaultValue;

    /** JSON array of options for SELECT/RADIO/CHECKBOX controls. */
    private String options;

    private BigDecimal minValue;

    private BigDecimal maxValue;

    private String unit;

    private Boolean isRequired;
}
