package com.syncflow.process.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Detailed view object for a process route, including all operations.
 */
@Data
public class ProcessRouteDetailVO {

    private Long id;

    private String routeNo;

    private String name;

    private String version;

    private Long bomId;

    private Long projectId;

    private Long orderProductId;

    private String productCode;

    private String productName;

    /** 1=draft, 2=pending_approval, 3=approved, 4=rejected, 5=published. */
    private Integer status;

    private Boolean isLatest;

    private Integer totalOperations;

    private BigDecimal totalManHours;

    private BigDecimal totalMaterialCost;

    private Long createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /** Ordered operations belonging to this route. */
    private List<OperationVO> operations;
}
