package com.syncflow.workflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.workflow.entity.ChangeRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Interceptor for published-entity edit operations.
 * <p>
 * When an entity is in published state and a user attempts to modify it,
 * this interceptor creates a ChangeRequest and starts a CHANGE_APPROVAL workflow.
 * The actual modification is deferred until the change is approved.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ChangeApprovalInterceptor {

    @Lazy
    private final WorkflowService workflowService;

    @Lazy
    private final ChangeRequestService changeRequestService;

    private final ObjectMapper objectMapper;

    /**
     * Intercept a change operation on a published entity.
     *
     * @param entityType     object type for the change request (e.g. "BOM_CHANGE", "PROCESS_CHANGE")
     * @param entityId       the target entity id
     * @param entityStatus   current status of the entity
     * @param publishedStatus the status code that represents "published"
     * @param changeType     type of change (e.g. "ADD_ITEM", "UPDATE_ITEM")
     * @param changeData     the change payload (will be serialized to JSON)
     * @param changeSummary  human-readable summary (may be null)
     * @param projectId      owning project id (may be null for global entities)
     * @param applicantId    the requesting user id
     * @return {@code true} if the operation was intercepted (caller should return early),
     *         {@code false} if the entity is not published and the operation should proceed normally
     */
    public boolean intercept(String entityType, Long entityId, Integer entityStatus,
                             Integer publishedStatus, String changeType, Object changeData,
                             String changeSummary, Long projectId, Long applicantId) {
        if (!entityStatus.equals(publishedStatus)) {
            return false; // not published — allow direct modification
        }

        // Idempotency: reject if a pending change request already exists for this entity
        List<ChangeRequest> existing = changeRequestService.getRequestsByObject(entityType, entityId);
        boolean hasPending = existing.stream().anyMatch(cr -> cr.getStatus() == 1);
        if (hasPending) {
            throw new BusinessException(ErrorCode.APPROVAL_ALREADY_DONE,
                    "该对象已有待审批的变更请求，请等待审批完成后再提交新的变更");
        }

        try {
            String jsonData = objectMapper.writeValueAsString(changeData);
            Long crId = changeRequestService.createRequest(
                    entityType, entityId, changeType, jsonData, changeSummary, applicantId);

            // Start the change approval workflow with the change request as the business object
            workflowService.startProcess(
                    "CHANGE_APPROVAL",
                    crId,
                    entityType,
                    entityType + " Change #" + crId,
                    projectId,
                    applicantId,
                    null
            );

            log.info("Change intercepted: entityType={}, entityId={}, changeType={}, crId={}",
                    entityType, entityId, changeType, crId);
            return true;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to create change request for {}:{}", entityType, entityId, e);
            throw new RuntimeException("Failed to submit change for approval", e);
        }
    }
}
