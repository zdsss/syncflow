package com.syncflow.bom.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Full detail view object for a single BOM.
 */
@Data
public class BomVO {

    private Long id;

    private String bomNo;

    private String name;

    private String version;

    private Long projectId;

    private Long orderProductId;

    private String productCode;

    private String productName;

    /** Status code (1-5). */
    private Integer status;

    /** Chinese label for the status. */
    private String statusName;

    private String flowInstanceId;

    private Boolean isLatest;

    private Long parentBomId;

    private String changeSummary;

    private Integer totalItems;

    private BigDecimal totalWeight;

    private Long tenantId;

    private Long createdBy;

    private Long approvedBy;

    private LocalDateTime approvedAt;

    private LocalDateTime releasedAt;

    // ---- Enriched display fields ----

    /** Display name of the creator. */
    private String createdByName;

    /** Display name of the approver. */
    private String approvedByName;

    /** Project name. */
    private String projectName;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
