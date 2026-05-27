package com.syncflow.workflow.service.impl;

import com.syncflow.workflow.entity.BusinessObject;
import com.syncflow.workflow.mapper.BusinessObjectMapper;
import com.syncflow.workflow.mapper.CcRecordMapper;
import com.syncflow.workflow.service.ApprovalCallbackRegistry;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.HistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Handles the transactional completion logic for approval processes.
 * <p>
 * Extracted from {@code ApprovalEventListener} to ensure that Spring's
 * proxy-based {@code @Transactional} AOP is properly applied. Direct
 * self-invocation within the listener class would bypass the proxy,
 * causing the transaction annotation to be ignored.
 */
@Slf4j
@Service
public class ApprovalCompletionHandler {

    private final BusinessObjectMapper businessObjectMapper;
    private final ApprovalCallbackRegistry callbackRegistry;
    private final HistoryService historyService;

    @Autowired(required = false)
    private com.syncflow.message.service.NotificationService notificationService;

    @Autowired(required = false)
    private com.syncflow.message.service.NotificationPushService pushService;

    @Autowired(required = false)
    private CacheManager cacheManager;

    @Autowired(required = false)
    private CcRecordMapper ccRecordMapper;

    public ApprovalCompletionHandler(BusinessObjectMapper businessObjectMapper,
                                     ApprovalCallbackRegistry callbackRegistry,
                                     HistoryService historyService) {
        this.businessObjectMapper = businessObjectMapper;
        this.callbackRegistry = callbackRegistry;
        this.historyService = historyService;
    }

    /**
     * Handles process completion within a proper transaction boundary.
     * <p>
     * Performs an atomic conditional update (optimistic lock on status=2) to
     * prevent duplicate callbacks in concurrent scenarios, then dispatches
     * to the appropriate {@link com.syncflow.workflow.service.ApprovalCallbackHandler}.
     *
     * @param bo the business object associated with the completed process
     */
    @Transactional
    public void handleProcessCompleted(BusinessObject bo) {
        log.info("Process completed for business object {}", bo.getId());

        // Atomic status check: skip if already processed
        if (bo.getStatus() != null && (bo.getStatus() == 3 || bo.getStatus() == 4)) {
            log.info("Business object {} already processed (status={}), skipping duplicate callback",
                    bo.getId(), bo.getStatus());
            return;
        }

        // Determine if the process ended with approval or rejection by reading
        // the "approved" variable from the process history.
        boolean approved = false; // default to rejected (fail-closed) for safety
        try {
            var historicVar = historyService
                    .createHistoricVariableInstanceQuery()
                    .processInstanceId(bo.getFlowInstanceId())
                    .variableName("approved")
                    .singleResult();
            if (historicVar != null && historicVar.getValue() instanceof Boolean boolVal) {
                approved = boolVal;
            }
        } catch (Exception e) {
            log.warn("Could not read 'approved' variable from history for process {}: {}",
                    bo.getFlowInstanceId(), e.getMessage());
        }

        // Read approverId from process history and set completedBy
        Long completedBy = null;
        try {
            var approverVar = historyService
                    .createHistoricVariableInstanceQuery()
                    .processInstanceId(bo.getFlowInstanceId())
                    .variableName("approverId")
                    .singleResult();
            if (approverVar != null && approverVar.getValue() instanceof Number n) {
                completedBy = n.longValue();
            }
        } catch (Exception e) {
            log.warn("Could not read 'approverId' variable for process {}: {}",
                    bo.getFlowInstanceId(), e.getMessage());
        }

        // Atomic conditional update: only update if status is still 2 (pending)
        int newStatus = approved ? 3 : 4;
        BusinessObject updateEntity = new BusinessObject();
        updateEntity.setId(bo.getId());
        updateEntity.setStatus(newStatus);
        updateEntity.setCurrentTaskId(null);
        updateEntity.setCurrentNode(null);
        updateEntity.setCompletedAt(LocalDateTime.now());
        updateEntity.setUpdatedAt(LocalDateTime.now());
        updateEntity.setCompletedBy(completedBy);

        int affected = businessObjectMapper.update(updateEntity,
                new LambdaQueryWrapper<BusinessObject>()
                        .eq(BusinessObject::getId, bo.getId())
                        .eq(BusinessObject::getStatus, 2));

        if (affected == 0) {
            log.info("Business object {} status already changed (concurrent update), skipping callback", bo.getId());
            return;
        }

        // Now safe to dispatch callback — we won the race
        if (approved) {
            callbackRegistry.onApproved(bo.getObjectType(), bo.getObjectId(), completedBy);
            notifyApplicant(bo, true, null);
        } else {
            callbackRegistry.onRejected(bo.getObjectType(), bo.getObjectId(), null);
            notifyApplicant(bo, false, null);
        }

        // Broadcast to /topic/approvals for real-time list refresh
        if (pushService != null) {
            try {
                Map<String, Object> payload = new java.util.HashMap<>();
                payload.put("event", "PROCESS_COMPLETED");
                payload.put("boId", bo.getId());
                payload.put("objectType", bo.getObjectType());
                payload.put("objectId", bo.getObjectId());
                payload.put("projectId", bo.getProjectId());
                payload.put("approved", approved);
                payload.put("status", newStatus);
                pushService.sendToTopic("/topic/approvals", payload);
            } catch (Exception e) {
                log.warn("Failed to broadcast approval completion: {}", e.getMessage());
            }
        }

        // Evict dashboard cache so next request gets fresh data
        evictDashboardCache();

        // Notify CC users about the completion
        notifyCcUsers(bo, approved);
    }

    private void notifyApplicant(BusinessObject bo, boolean approved, String reason) {
        if (notificationService == null || bo.getApplicantId() == null) {
            return;
        }
        try {
            String title = approved ? "审批已通过" : "审批已驳回";
            String content = approved
                    ? "您提交的 [" + bo.getObjectName() + "] 已审批通过"
                    : "您提交的 [" + bo.getObjectName() + "] 已被驳回" + (reason != null ? "，原因: " + reason : "");
            notificationService.sendNotification(
                    bo.getApplicantId(),
                    "APPROVAL_RESULT",
                    title,
                    content,
                    bo.getObjectType(),
                    bo.getObjectId()
            );
        } catch (Exception e) {
            log.warn("Failed to notify applicant {} for business object {}: {}",
                    bo.getApplicantId(), bo.getId(), e.getMessage());
        }
    }

    private void evictDashboardCache() {
        if (cacheManager == null) return;
        try {
            org.springframework.cache.Cache cache = cacheManager.getCache("dashboard:summary");
            if (cache != null) {
                cache.clear();
            }
        } catch (Exception e) {
            log.debug("Failed to evict dashboard cache: {}", e.getMessage());
        }
    }

    private void notifyCcUsers(BusinessObject bo, boolean approved) {
        if (notificationService == null || ccRecordMapper == null) return;
        try {
            var ccRecords = ccRecordMapper.selectList(
                    new LambdaQueryWrapper<com.syncflow.workflow.entity.CcRecord>()
                            .eq(com.syncflow.workflow.entity.CcRecord::getBusinessObjectId, bo.getId())
            );
            if (ccRecords == null || ccRecords.isEmpty()) return;

            String objectName = bo.getObjectName() != null ? bo.getObjectName() : "审批项#" + bo.getId();
            String title = approved ? "抄送审批已通过" : "抄送审批已驳回";
            String content = approved
                    ? "[" + objectName + "] 审批已通过"
                    : "[" + objectName + "] 审批已被驳回";

            for (var cc : ccRecords) {
                try {
                    notificationService.sendNotification(
                            cc.getUserId(),
                            "APPROVAL_CC_RESULT",
                            title,
                            content,
                            bo.getObjectType(),
                            bo.getObjectId()
                    );
                } catch (Exception e) {
                    log.debug("Failed to notify CC user {}: {}", cc.getUserId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to notify CC users for business object {}: {}", bo.getId(), e.getMessage());
        }
    }
}
