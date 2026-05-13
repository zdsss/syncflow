package com.syncflow.workflow.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Generic business object binding table.
 * <p>
 * Links any business entity (task, BOM, milestone, etc.) to a Flowable workflow
 * process instance so that the approval workflow layer is fully decoupled from
 * individual domain models.
 */
@Data
@TableName("wf_business_object")
public class BusinessObject implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** Business object type, e.g. TASK, BOM, MILESTONE. */
    private String objectType;

    /** Primary key of the business entity in its own table. */
    private Long objectId;

    /** Human-readable name of the business object. */
    private String objectName;

    /** Machine-readable code (e.g. task_no, bom_no). */
    private String objectCode;

    /** Owning project id. */
    private Long projectId;

    /**
     * Approval status.
     * <ul>
     *   <li>1 = draft</li>
     *   <li>2 = pending approval (审批中)</li>
     *   <li>3 = approved (已通过)</li>
     *   <li>4 = rejected (已驳回)</li>
     *   <li>5 = withdrawn (已撤回)</li>
     * </ul>
     */
    private Integer status;

    /** Current BPMN node id / name. */
    private String currentNode;

    /** Current Flowable user-task id. */
    private String currentTaskId;

    /** Flowable process definition id. */
    private String flowDefinitionId;

    /** Flowable process definition key. */
    private String flowDefinitionKey;

    /** Process definition version. */
    private Integer flowVersion;

    /** Flowable runtime process instance id. */
    private String flowInstanceId;

    /** FK to sys_user.id — the person who initiated the approval. */
    private Long applicantId;

    /** Timestamp when the approval was submitted. */
    private LocalDateTime appliedAt;

    /** Timestamp when the approval was completed (approved / rejected / withdrawn). */
    private LocalDateTime completedAt;

    /** FK to sys_user.id — the person who completed / rejected the approval. */
    private Long completedBy;

    /** Tenant identifier for multi-tenancy. */
    private Long tenantId;

    /** Number of reminder notifications sent for this approval. */
    private Integer reminderCount;

    /** Timestamp of the last reminder notification. */
    private LocalDateTime lastRemindedAt;

    /** Row creation timestamp. */
    private LocalDateTime createdAt;

    /** Row last-update timestamp. */
    private LocalDateTime updatedAt;
}
