package com.syncflow.project.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * View object for stage gate display with active task information.
 */
@Data
public class StageGateVO {

    private Long id;

    /** FK to prj_phase.id. */
    private Long phaseId;

    /** Gate display name. */
    private String name;

    /** Gate type code: DQR, TR, QG, etc. */
    private String gateType;

    /** Gate status: 1=pending, 2=approved, 3=rejected. */
    private Integer status;

    /** Workflow engine instance identifier. */
    private String flowInstanceId;

    /** Workflow task identifier. */
    private String taskId;

    /** FK to sys_user.id who approved/rejected. */
    private Long approverId;

    /** Timestamp when gate was approved or rejected. */
    private LocalDateTime approvedAt;

    /** Reviewer comments. */
    private String comments;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // --- Active task enrichment fields ---

    /** Display name of the current active flow task (if any). */
    private String activeTaskName;

    /** Status label of the current active flow task (if any). */
    private String activeTaskStatus;

    /** Assignee user id of the current active flow task (if any). */
    private Long activeTaskAssigneeId;
}
