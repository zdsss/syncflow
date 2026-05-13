package com.syncflow.bom.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Tree-structured view object for a BOM item.
 * <p>
 * Children are nested recursively.
 */
@Data
public class BomItemTreeVO {

    private Long id;

    private Long bomId;

    private Long parentId;

    private Integer level;

    private String path;

    private Integer seqNo;

    private String levelNo;

    private String materialCode;

    private String drawingNo;

    private String name;

    private String specification;

    private String material;

    private String surfaceTreatment;

    private String unit;

    private BigDecimal unitPrice;

    private BigDecimal weight;

    private BigDecimal totalWeight;

    private BigDecimal quantity;

    /** Source type code: MADE, PURCHASED, SUBCONTRACT. */
    private String sourceType;

    private Boolean isVirtual;

    private String storageLocation;

    private String unitOfMeasure;

    private String incomingInspection;

    private Boolean isOptional;

    private String remark;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /** Child items in the tree. */
    private List<BomItemTreeVO> children;
}
