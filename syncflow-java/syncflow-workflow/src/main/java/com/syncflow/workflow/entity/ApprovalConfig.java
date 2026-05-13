package com.syncflow.workflow.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Approval routing configuration.
 * <p>
 * Defines how approval assignees are resolved for each BPMN node of a given
 * business object type. Supports multiple rule types (project role, specific
 * user, department head, dynamic expression).
 */
@Data
@TableName("wf_approval_config")
public class ApprovalConfig implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** Business object type, e.g. TASK, BOM, MILESTONE. */
    private String objectType;

    /** Flowable process-definition key. */
    private String processKey;

    /** BPMN node id within the process. */
    private String nodeId;

    /** Human-readable node name. */
    private String nodeName;

    /**
     * How assignees are resolved:
     * <ul>
     *   <li>PROJECT_ROLE — look up users by project role</li>
     *   <li>USER — hardcoded user id(s)</li>
     *   <li>DEPARTMENT — resolve to department head</li>
     *   <li>DYNAMIC — evaluate a SpEL / JEXL expression</li>
     * </ul>
     */
    private String ruleType;

    /**
     * The value associated with the rule.
     * <ul>
     *   <li>PROJECT_ROLE → role code, e.g. "PM"</li>
     *   <li>USER → comma-separated user ids, e.g. "1,2,3"</li>
     *   <li>DEPARTMENT → department id</li>
     *   <li>DYNAMIC → expression string</li>
     * </ul>
     */
    private String ruleValue;

    /** Optional SpEL / JEXL expression for dynamic resolution. */
    private String expression;

    /** Lower value = higher priority when multiple configs match. */
    private Integer priority;

    /** SpEL expression that, when evaluating to true, skips this node. */
    private String skipExpression;

    /** Whether this approval step is mandatory. */
    private Boolean required;

    /** Whether this configuration row is active. */
    private Boolean enabled;

    /** Row creation timestamp. */
    private LocalDateTime createdAt;

    /** Row last-update timestamp. */
    private LocalDateTime updatedAt;
}
