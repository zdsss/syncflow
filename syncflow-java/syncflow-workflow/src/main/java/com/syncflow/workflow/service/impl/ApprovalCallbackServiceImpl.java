package com.syncflow.workflow.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.workflow.entity.BusinessObject;
import com.syncflow.workflow.mapper.BusinessObjectMapper;
import com.syncflow.workflow.service.ApprovalCallbackRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * BPMN callback service for the GENERIC_APPROVAL process.
 * <p>
 * Referenced by BPMN service tasks via {@code flowable:expression}.
 * Uses atomic conditional UPDATE to prevent duplicate callback dispatch
 * when racing with {@link ApprovalEventListener#onProcessCompleted}.
 */
@Service("approvalCallbackService")
@Slf4j
@RequiredArgsConstructor
public class ApprovalCallbackServiceImpl {

    @Lazy
    private final ApprovalCallbackRegistry callbackRegistry;
    private final BusinessObjectMapper businessObjectMapper;

    public void onApproved(DelegateExecution execution) {
        String objectType = getStringVariable(execution, "objectType");
        Long objectId = getLongVariable(execution, "objectId");
        Long businessObjectId = getLongVariable(execution, "businessObjectId");
        Long approverId = getLongVariable(execution, "approverId");
        if (approverId == null) {
            approverId = getLongVariable(execution, "applicantId");
        }

        if (objectType == null || objectId == null) {
            log.error("Missing objectType or objectId in execution variables");
            return;
        }

        if (businessObjectId != null && !tryClaimBusinessObject(businessObjectId, 3, approverId)) {
            log.info("BusinessObject {} already processed, skipping BPMN approved callback for {}/{}",
                    businessObjectId, objectType, objectId);
            return;
        }

        log.info("GENERIC_APPROVAL approved: objectType={}, objectId={}, approverId={}", objectType, objectId, approverId);
        callbackRegistry.onApproved(objectType, objectId, approverId);
    }

    public void onRejected(DelegateExecution execution) {
        String objectType = getStringVariable(execution, "objectType");
        Long objectId = getLongVariable(execution, "objectId");
        Long businessObjectId = getLongVariable(execution, "businessObjectId");
        String reason = getStringVariable(execution, "approvalComment");

        if (objectType == null || objectId == null) {
            log.error("Missing objectType or objectId in execution variables");
            return;
        }

        if (businessObjectId != null && !tryClaimBusinessObject(businessObjectId, 4, null)) {
            log.info("BusinessObject {} already processed, skipping BPMN rejection callback for {}/{}",
                    businessObjectId, objectType, objectId);
            return;
        }

        log.info("GENERIC_APPROVAL rejected: objectType={}, objectId={}", objectType, objectId);
        callbackRegistry.onRejected(objectType, objectId, reason);
    }

    /**
     * Atomic conditional UPDATE: set status to newStatus only if currently PENDING (2).
     * Returns true if this call won the race (affected 1 row), false otherwise.
     */
    private boolean tryClaimBusinessObject(Long businessObjectId, int newStatus, Long completedBy) {
        BusinessObject updateEntity = new BusinessObject();
        updateEntity.setId(businessObjectId);
        updateEntity.setStatus(newStatus);
        updateEntity.setCompletedAt(LocalDateTime.now());
        updateEntity.setUpdatedAt(LocalDateTime.now());
        updateEntity.setCompletedBy(completedBy);
        updateEntity.setCurrentTaskId(null);
        updateEntity.setCurrentNode(null);

        int affected = businessObjectMapper.update(updateEntity,
                new LambdaQueryWrapper<BusinessObject>()
                        .eq(BusinessObject::getId, businessObjectId)
                        .eq(BusinessObject::getStatus, 2));
        return affected > 0;
    }

    private String getStringVariable(DelegateExecution execution, String name) {
        Object val = execution.getVariable(name);
        return val != null ? val.toString() : null;
    }

    private Long getLongVariable(DelegateExecution execution, String name) {
        Object val = execution.getVariable(name);
        if (val instanceof Long l) return l;
        if (val instanceof Number n) return n.longValue();
        if (val instanceof String s) {
            try { return Long.parseLong(s); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }
}
