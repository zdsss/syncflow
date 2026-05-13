package com.syncflow.config.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO for creating a new module spec.
 */
@Data
public class CreateSpecDTO {

    @NotBlank(message = "Spec name is required")
    private String specName;

    @NotBlank(message = "Cross section is required")
    private String crossSection;

    @NotBlank(message = "Material is required")
    private String material;

    private BigDecimal wallThickness;

    private String connectionType;
}
