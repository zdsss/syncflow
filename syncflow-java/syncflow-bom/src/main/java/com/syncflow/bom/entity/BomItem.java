package com.syncflow.bom.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * BOM item (tree structure).
 * <p>
 * Maps to the {@code bom_item} table.
 */
@Data
@TableName("bom_item")
public class BomItem {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to bom_bom.id. */
    private Long bomId;

    /** FK to bom_item.id, parent item in the tree. */
    private Long parentId;

    /** Depth level in the BOM tree (1 = root). */
    private Integer level;

    /** Materialised ancestor path for fast tree queries. */
    private String path;

    /** Sort order among siblings. */
    private Integer seqNo;

    /** Level number string for display (e.g. 1.2.3). */
    private String levelNo;

    /** Material/part code. */
    private String materialCode;

    /** Drawing number reference. */
    private String drawingNo;

    /** Item name. */
    private String name;

    /** Item specification / description. */
    private String specification;

    /** Physical material type. */
    private String material;

    /** Surface treatment / finish. */
    private String surfaceTreatment;

    /** Unit of measure for quantity. */
    private String unit;

    /** Unit price. */
    private BigDecimal unitPrice;

    /** Weight per unit. */
    private BigDecimal weight;

    /** Total weight (quantity * weight). */
    private BigDecimal totalWeight;

    /** Required quantity. */
    private BigDecimal quantity;

    /** Source type: MADE, PURCHASED, SUBCONTRACT. */
    private String sourceType;

    /** True if virtual/non-physical item. */
    private Boolean isVirtual;

    /** Default storage location. */
    private String storageLocation;

    /** Alternate unit of measure. */
    private String unitOfMeasure;

    /** Incoming inspection flag. */
    private String incomingInspection;

    /** True if this is an optional item. */
    private Boolean isOptional;

    /** Free-form remarks. */
    private String remark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
