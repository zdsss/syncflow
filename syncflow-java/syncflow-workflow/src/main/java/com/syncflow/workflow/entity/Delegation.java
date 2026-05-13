package com.syncflow.workflow.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Approval delegation record.
 * <p>
 * Captures the delegation of approval authority from one user to another for a
 * specific business object, with an optional time window.
 */
@Data
@TableName("wf_delegation")
public class Delegation implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** FK to wf_business_object.id. */
    private Long businessObjectId;

    /** FK to sys_user.id — the original approver delegating their authority. */
    private Long fromUserId;

    /** FK to sys_user.id — the user receiving delegated authority. */
    private Long toUserId;

    /** Reason for delegation. */
    private String reason;

    /** Delegation start time. */
    private LocalDateTime startTime;

    /** Delegation end time (null means indefinite). */
    private LocalDateTime endTime;

    /** Whether this delegation is currently active. */
    private Boolean isActive;

    /** Row creation timestamp. */
    private LocalDateTime createdAt;
}
