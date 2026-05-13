package com.syncflow.workflow.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * View object returned when querying approval configurations.
 */
@Data
public class ApprovalConfigVO {

    private Long id;

    private String objectType;

    private String processKey;

    private String nodeId;

    private String nodeName;

    private String ruleType;

    private String ruleValue;

    private String expression;

    private Integer priority;

    private String skipExpression;

    private Boolean required;

    private Boolean enabled;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
