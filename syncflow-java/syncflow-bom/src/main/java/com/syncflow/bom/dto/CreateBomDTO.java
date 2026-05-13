package com.syncflow.bom.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO for creating a new BOM.
 */
@Data
public class CreateBomDTO {

    /** BOM display name. */
    @NotBlank(message = "BOM名称不能为空")
    private String name;

    /** FK to prj_project.id. */
    private Long projectId;

    /** FK to cfg_order_product.id. */
    private Long orderProductId;

    /** Product code. */
    private String productCode;

    /** Product display name. */
    private String productName;

    /** Parent BOM id (for derived BOMs). */
    private Long parentBomId;

    /** Summary of changes. */
    private String changeSummary;
}
