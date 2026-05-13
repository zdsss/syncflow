package com.syncflow.workflow.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * VO representing a business object with its approval state.
 */
@Data
public class BusinessObjectVO {

    private Long id;
    private String objectType;
    private Long objectId;
    private String objectName;
    private String objectCode;
    private Long projectId;
    private Integer status;
    private String currentNode;
    private String currentTaskId;
    private String flowDefinitionId;
    private String flowDefinitionKey;
    private Integer flowVersion;
    private String flowInstanceId;
    private Long applicantId;
    private String applicantName;
    private LocalDateTime appliedAt;
    private LocalDateTime completedAt;
    private Long completedBy;
    private Long tenantId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
