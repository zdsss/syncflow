package com.syncflow.workflow.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * VO representing a single approval history entry.
 */
@Data
public class ApprovalCommentVO {

    private Long id;

    /** BPMN node name at the time of action. */
    private String nodeName;

    /** Display name of the approver. */
    private String approverName;

    /** Action type: APPROVE, REJECT, TRANSFER, DELEGATE, ADD_SIGN. */
    private String action;

    /** Optional comment text. */
    private String comment;

    /** Timestamp of the action. */
    private LocalDateTime createdAt;
}
