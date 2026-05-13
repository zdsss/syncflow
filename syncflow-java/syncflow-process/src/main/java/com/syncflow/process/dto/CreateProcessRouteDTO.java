package com.syncflow.process.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO for creating a new process route.
 */
@Data
public class CreateProcessRouteDTO {

    @NotBlank(message = "工艺路线名称不能为空")
    private String name;

    /** FK to prj_project.id. */
    private Long projectId;

    /** FK to bom_bom.id. */
    private Long bomId;

    /** Product code. */
    private String productCode;

    /** Product name. */
    private String productName;
}
