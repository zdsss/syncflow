package com.syncflow.common.dto.template;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating or updating a template.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTemplateDTO {

    @NotBlank(message = "Template name is required")
    private String name;

    private String description;
    private String type;
    private String content;
    private String category;
}
