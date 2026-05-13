package com.syncflow.bom.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO for creating/updating a BOM item.
 */
@Data
public class CreateBomItemDTO {

    /** Parent item id in the tree (null for root-level items). */
    private Long parentId;

    /** Sort order among siblings. */
    private Integer seqNo;

    /** Material/part code. */
    private String materialCode;

    /** Drawing number. */
    private String drawingNo;

    /** Item name. */
    @NotBlank(message = "物料名称不能为空")
    private String name;

    /** Specification / description. */
    private String specification;

    /** Physical material type. */
    private String material;

    /** Surface treatment / finish. */
    private String surfaceTreatment;

    /** Unit of measure. */
    private String unit;

    /** Unit price. */
    private BigDecimal unitPrice;

    /** Weight per unit. */
    private BigDecimal weight;

    /** Required quantity (defaults to 1). */
    private BigDecimal quantity;

    /** Source type: MADE, PURCHASED, SUBCONTRACT. */
    @NotBlank(message = "来源类型不能为空")
    private String sourceType;

    /** True if virtual/non-physical item. */
    private Boolean isVirtual;

    /** Default storage location. */
    private String storageLocation;

    /** Alternate unit of measure. */
    private String unitOfMeasure;

    /** Incoming inspection flag. */
    private String incomingInspection;

    /** True if optional item. */
    private Boolean isOptional;

    /** Free-form remarks. */
    private String remark;
}
