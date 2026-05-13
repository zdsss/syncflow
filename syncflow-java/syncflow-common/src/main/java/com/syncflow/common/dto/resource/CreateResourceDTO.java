package com.syncflow.common.dto.resource;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating or updating a resource.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateResourceDTO {

    @NotBlank(message = "Resource name is required")
    private String name;

    private String type;
    private String description;
    private Integer status;
    private String content;
}
