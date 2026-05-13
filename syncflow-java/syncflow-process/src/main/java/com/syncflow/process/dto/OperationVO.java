package com.syncflow.process.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * View object for an operation within a process route.
 */
@Data
public class OperationVO {

    private Long id;

    private Long routeId;

    private Integer seqNo;

    private String operationNo;

    private String name;

    private String description;

    private String materialCode;

    private String materialName;

    private String drawingNo;

    private String sourceType;

    private Boolean isVirtual;

    private Long workCenterId;

    private String workCenterCode;

    private String workCenterName;

    private Integer status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
