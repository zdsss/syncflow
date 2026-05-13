package com.syncflow.workflow.service;

import com.syncflow.workflow.dto.ApprovalCommentVO;
import com.syncflow.workflow.dto.ApprovalTaskVO;
import com.syncflow.workflow.dto.BusinessObjectVO;

import java.util.List;

/**
 * Core workflow service interface.
 * <p>
 * Provides a generic approval API that binds ANY business entity to a Flowable
 * process. Callers only need to supply a process key and the target object
 * metadata; the workflow engine handles routing, task assignment, and history.
 */
public interface WorkflowService {

    /**
     * Start an approval process for a business object.
     *
     * @param processKey  Flowable process-definition key
     * @param objectId    primary key of the business entity
     * @param objectType  business type, e.g. TASK, BOM
     * @param objectName  human-readable display name
     * @param projectId   owning project id
     * @param applicantId the user initiating the approval
     * @return the id of the newly created {@code wf_business_object} record
     */
    Long startProcess(String processKey, Long objectId, String objectType,
                      String objectName, Long projectId, Long applicantId);

    /**
     * Start an approval process with optional CC users.
     *
     * @param ccUserIds user ids to CC on this approval (may be null or empty)
     */
    Long startProcess(String processKey, Long objectId, String objectType,
                      String objectName, Long projectId, Long applicantId,
                      java.util.List<Long> ccUserIds);

    /**
     * Complete an approval task (approve or reject).
     *
     * @param taskId     Flowable user-task id
     * @param approverId the user completing the task
     * @param approved   {@code true} to approve, {@code false} to reject
     * @param comment    optional comment
     */
    void completeTask(String taskId, Long approverId, boolean approved, String comment);

    /**
     * Get pending approval tasks assigned to a user.
     *
     * @param userId target user id
     * @return list of pending tasks
     */
    List<ApprovalTaskVO> getPendingTasks(Long userId);

    /**
     * Get completed/processed approval tasks for a user (tasks they have acted on).
     *
     * @param userId the user id
     * @return list of completed approval tasks
     */
    List<ApprovalTaskVO> getCompletedTasks(Long userId);

    /**
     * Get the full approval history for a business object.
     *
     * @param businessObjectId FK to wf_business_object.id
     * @return ordered list of approval comments / actions
     */
    List<ApprovalCommentVO> getApprovalHistory(Long businessObjectId);

    /**
     * Get the business object detail.
     *
     * @param id FK to wf_business_object.id
     * @return business object VO, or {@code null} if not found
     */
    BusinessObjectVO getBusinessObject(Long id);

    /**
     * Get the business object entity (for internal cross-module use).
     */
    com.syncflow.workflow.entity.BusinessObject getBusinessObjectEntity(Long id);

    /**
     * Find a business object by object type and object ID.
     */
    com.syncflow.workflow.entity.BusinessObject findBusinessObject(String objectType, Long objectId);

    /**
     * Withdraw a pending approval.
     *
     * @param businessObjectId FK to wf_business_object.id
     * @param userId           the user requesting the withdrawal (must be the applicant)
     */
    void withdrawApproval(Long businessObjectId, Long userId);

    /**
     * Withdraw a pending approval by its Flowable process instance ID.
     * Used when a task is manually completed while an approval is still pending.
     *
     * @param flowInstanceId the Flowable process instance ID
     */
    void withdrawByFlowInstanceId(String flowInstanceId);

    /**
     * Send a reminder notification to the current assignee of a pending approval.
     *
     * @param businessObjectId the business object to remind about
     * @param userId           the user requesting the reminder (must be the applicant)
     */
    void remindApproval(Long businessObjectId, Long userId);

    /**
     * Add a candidate user (加签) to an active Flowable task.
     *
     * @param taskId          the Flowable user-task id
     * @param candidateUserId the user to add as a candidate
     */
    void addCandidateUser(String taskId, Long candidateUserId);

    /**
     * Check if approval is enabled for a given object type.
     *
     * @param objectType the business object type (e.g. PROJECT, TASK)
     * @return true if approval is configured and enabled for this type
     */
    boolean isApprovalRequired(String objectType);

    /**
     * Reassign (transfer) an active Flowable task to a different user.
     *
     * @param taskId    the Flowable user-task id
     * @param newUserId the user to reassign to
     */
    void reassignTask(String taskId, Long newUserId);
}
