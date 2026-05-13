package com.syncflow.workflow.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Workflow template linked to a Flowable BPMN process definition.
 * <p>
 * Maps to the {@code wf_workflow_template} table.
 */
@Data
@TableName("wf_workflow_template")
public class WorkflowTemplate {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long tenantId;

    private String name;

    private String description;

    /** Flowable BPMN process key this template maps to. */
    private String bpmnProcessKey;

    /** Default assignee resolution rule type. */
    private String defaultAssigneeRule;

    /** Additional configuration (approval chain, CC rules, etc.). */
    private String configJson;

    private Boolean isActive;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
