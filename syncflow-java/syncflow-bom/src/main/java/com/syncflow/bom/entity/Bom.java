package com.syncflow.bom.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * BOM main entity.
 * <p>
 * Maps to the {@code bom_bom} table.
 */
@Data
@TableName("bom_bom")
public class Bom {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** Auto-generated BOM number, e.g. BOM-20260506-0001. */
    private String bomNo;

    /** BOM display name. */
    private String name;

    /** Version string, e.g. 1.0, 2.1. */
    private String version;

    /** FK to prj_project.id. */
    private Long projectId;

    /** FK to cfg_order_product.id. */
    private Long orderProductId;

    /** Product code. */
    private String productCode;

    /** Product display name. */
    private String productName;

    /** 1=editing, 2=pending_approval, 3=published, 4=locked, 5=cancelled. */
    private Integer status;

    /** Workflow engine instance identifier. */
    private String flowInstanceId;

    /** True if this is the latest version. */
    private Boolean isLatest;

    /** FK to bom_bom.id, parent BOM for derived BOMs. */
    private Long parentBomId;

    /** Summary of changes for this version. */
    private String changeSummary;

    /** Denormalised count of BOM items. */
    private Integer totalItems;

    /** Total weight of all items. */
    private BigDecimal totalWeight;

    /** Tenant identifier for multi-tenancy. */
    private Long tenantId;

    /** FK to sys_user.id, BOM creator. */
    private Long createdBy;

    /** FK to sys_user.id, who approved this BOM. */
    private Long approvedBy;

    /** Timestamp when BOM was approved. */
    private LocalDateTime approvedAt;

    /** Timestamp when BOM was published/released. */
    private LocalDateTime releasedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
