package com.syncflow.process.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Process route entity.
 * <p>
 * Maps to the {@code prc_process_route} table.
 */
@Data
@TableName("prc_process_route")
public class ProcessRoute {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** Auto-generated route number, e.g. PRC-20260506-0001. */
    private String routeNo;

    /** Route name / title. */
    private String name;

    /** Version string, e.g. "1.0". */
    private String version;

    /** FK to bom_bom.id. */
    private Long bomId;

    /** FK to prj_project.id. */
    private Long projectId;

    /** FK to order_product.id. */
    private Long orderProductId;

    /** Product code. */
    private String productCode;

    /** Product name. */
    private String productName;

    /** 1=draft, 2=pending_approval, 3=approved, 4=rejected, 5=published. */
    private Integer status;

    /** Workflow engine instance identifier. */
    private String flowInstanceId;

    /** Whether this is the latest version of the route. */
    private Boolean isLatest;

    /** Denormalised total operation count. */
    private Integer totalOperations;

    /** Denormalised total man-hours across all operations. */
    private BigDecimal totalManHours;

    /** Denormalised total material cost across all operations. */
    private BigDecimal totalMaterialCost;

    /** Tenant identifier for multi-tenancy. */
    private Long tenantId;

    /** FK to sys_user.id, route creator. */
    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
