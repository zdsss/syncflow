package com.syncflow.workflow.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Change request entity for BOM / process-route / module-spec changes.
 * <p>
 * When a published entity needs modification, a ChangeRequest is created
 * and submitted through the CHANGE_APPROVAL workflow. On approval, the
 * change data is applied to the target entity.
 */
@Data
@TableName("wf_change_request")
public class ChangeRequest implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** Business object type: BOM_CHANGE, PROCESS_CHANGE, SPEC_CHANGE. */
    private String objectType;

    /** FK to the target entity (BOM id, process-route id, or module-spec id). */
    private Long objectId;

    /** Type of change: ADD_ITEM, UPDATE_ITEM, DELETE_ITEM, REORDER, UPDATE_SPEC. */
    private String changeType;

    /** JSON-encoded change data (stored as CLOB in H2, JSONB in PostgreSQL). */
    private String changeData;

    /** Human-readable summary of the change. */
    private String changeSummary;

    /**
     * Request status.
     * <ul>
     *   <li>1 = pending</li>
     *   <li>2 = applied</li>
     *   <li>3 = rejected</li>
     * </ul>
     */
    private Integer status;

    /** Flowable process instance id. */
    private String flowInstanceId;

    /** FK to sys_user.id — the user who requested the change. */
    private Long requestedBy;

    /** Timestamp when the request was submitted. */
    private LocalDateTime requestedAt;

    /** Timestamp when the request was resolved (applied or rejected). */
    private LocalDateTime resolvedAt;

    /** FK to sys_user.id — the user who resolved the request. */
    private Long resolvedBy;

    /** Tenant identifier. */
    private Long tenantId;

    /** Row creation timestamp. */
    private LocalDateTime createdAt;

    /** Row last-update timestamp. */
    private LocalDateTime updatedAt;
}
