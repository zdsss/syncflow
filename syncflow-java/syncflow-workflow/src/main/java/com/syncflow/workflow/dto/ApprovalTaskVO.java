package com.syncflow.workflow.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * VO representing a pending approval task for the task list view.
 */
@Data
public class ApprovalTaskVO {

    /** Flowable user-task id. */
    private String taskId;

    /** BPMN node / task name. */
    private String taskName;

    /** FK to wf_business_object.id. */
    private Long businessObjectId;

    /** Business object type (TASK, BOM, etc.). */
    private String objectType;

    /** Human-readable business object name. */
    private String objectName;

    /** Machine-readable business object code. */
    private String objectCode;

    /** Project id the business object belongs to. */
    private Long projectId;

    /** Display name of the applicant. */
    private String applicantName;

    /** Timestamp when the task was created / assigned. */
    private LocalDateTime createdAt;
}
