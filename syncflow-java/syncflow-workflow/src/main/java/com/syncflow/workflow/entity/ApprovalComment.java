package com.syncflow.workflow.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Approval comment / action record.
 * <p>
 * Captures every approval action (approve, reject, transfer, delegate, add_sign)
 * together with the optional human-readable comment left by the approver.
 */
@Data
@TableName("wf_approval_comment")
public class ApprovalComment implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** FK to wf_business_object.id. */
    private Long businessObjectId;

    /** Flowable user-task id that this comment is attached to. */
    private String taskId;

    /** BPMN node name for display purposes. */
    private String nodeName;

    /** FK to sys_user.id — the approver. */
    private Long approverId;

    /** Display name of the approver at the time of action. */
    private String approverName;

    /**
     * Action type:
     * <ul>
     *   <li>APPROVE — approved the request</li>
     *   <li>REJECT — rejected the request</li>
     *   <li>TRANSFER — transferred to another person</li>
     *   <li>DELEGATE — delegated to another person</li>
     *   <li>ADD_SIGN — added a countersignature step</li>
     * </ul>
     */
    private String action;

    /** Optional comment text. */
    private String comment;

    /** Row creation timestamp. */
    private LocalDateTime createdAt;
}
