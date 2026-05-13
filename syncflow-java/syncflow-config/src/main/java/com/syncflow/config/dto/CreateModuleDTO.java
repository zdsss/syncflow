package com.syncflow.config.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO for creating a new module.
 */
@Data
public class CreateModuleDTO {

    @NotBlank(message = "Module name is required")
    private String name;

    @NotBlank(message = "Module code is required")
    private String code;

    /** FK to cfg_module_category.id. */
    private Long categoryId;

    private String description;
}
