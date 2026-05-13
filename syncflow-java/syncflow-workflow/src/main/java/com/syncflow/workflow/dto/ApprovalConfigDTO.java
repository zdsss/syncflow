package com.syncflow.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request DTO for creating / updating an approval configuration.
 */
@Data
public class ApprovalConfigDTO {

    @NotBlank(message = "objectType must not be blank")
    private String objectType;

    @NotBlank(message = "processKey must not be blank")
    private String processKey;

    @NotBlank(message = "nodeId must not be blank")
    private String nodeId;

    @NotBlank(message = "nodeName must not be blank")
    private String nodeName;

    /**
     * Rule type: PROJECT_ROLE, USER, DEPARTMENT, DYNAMIC.
     */
    @NotBlank(message = "ruleType must not be blank")
    private String ruleType;

    private String ruleValue;

    private String expression;

    private Integer priority = 100;

    private String skipExpression;

    private Boolean required = true;

    private Boolean enabled = true;
}
