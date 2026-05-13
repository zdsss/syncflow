package com.syncflow.workflow.listener;

import com.syncflow.workflow.entity.BusinessObject;
import com.syncflow.workflow.entity.ApprovalConfig;
import com.syncflow.workflow.mapper.BusinessObjectMapper;
import com.syncflow.workflow.mapper.ApprovalConfigMapper;
import com.syncflow.workflow.service.ApprovalAssigneeResolver;
import com.syncflow.workflow.service.ApprovalCallbackRegistry;
import com.syncflow.workflow.service.DelegationService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.extern.slf4j.Slf4j;
import org.flowable.common.engine.api.delegate.event.FlowableEngineEntityEvent;
import org.flowable.common.engine.api.delegate.event.FlowableEngineEventType;
import org.flowable.common.engine.api.delegate.event.FlowableEvent;
import org.flowable.common.engine.api.delegate.event.FlowableEventListener;
import org.flowable.engine.HistoryService;
import org.flowable.task.api.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Flowable event listener that keeps {@code wf_business_object} in sync with
 * the Flowable runtime state.
 * <p>
 * Handles:
 * <ul>
 *   <li>TASK_CREATED  — records the current task id on the BusinessObject</li>
 *   <li>TASK_COMPLETED — clears the current task id</li>
 *   <li>PROCESS_COMPLETED — sets completedAt and status to approved</li>
 *   <li>PROCESS_CANCELLED — sets status to withdrawn</li>
 * </ul>
 * <p>
 * Optionally sends notifications via {@code NotificationService} when a task
 * is assigned. The notification dependency is injected as optional to avoid
 * hard coupling with the message module.
 */
@Slf4j
@Component
public class ApprovalEventListener implements FlowableEventListener {

    private final BusinessObjectMapper businessObjectMapper;
    private final ApprovalConfigMapper approvalConfigMapper;
    private final ApprovalAssigneeResolver assigneeResolver;
    private final org.flowable.engine.TaskService flowableTaskService;
    private final DelegationService delegationService;
    private final ApprovalCallbackRegistry callbackRegistry;
    private final HistoryService historyService;

    @Autowired(required = false)
    private com.syncflow.message.service.NotificationService notificationService;

    @Autowired(required = false)
    private com.syncflow.message.service.NotificationPushService pushService;

    @Autowired(required = false)
    private org.springframework.cache.CacheManager cacheManager;

    @Autowired(required = false)
    private com.syncflow.workflow.mapper.CcRecordMapper ccRecordMapper;

    public ApprovalEventListener(BusinessObjectMapper businessObjectMapper,
                                  @Lazy ApprovalConfigMapper approvalConfigMapper,
                                  @Lazy ApprovalAssigneeResolver assigneeResolver,
                                  @Lazy org.flowable.engine.TaskService flowableTaskService,
                                  @Lazy DelegationService delegationService,
                                  @Lazy ApprovalCallbackRegistry callbackRegistry,
                                  @Lazy HistoryService historyService) {
        this.businessObjectMapper = businessObjectMapper;
        this.approvalConfigMapper = approvalConfigMapper;
        this.assigneeResolver = assigneeResolver;
        this.flowableTaskService = flowableTaskService;
        this.delegationService = delegationService;
        this.callbackRegistry = callbackRegistry;
        this.historyService = historyService;
    }

    @Override
    public void onEvent(FlowableEvent event) {
        if (event.getType() == null) return;
        String eventType = event.getType().name();

        if (FlowableEngineEventType.TASK_CREATED.name().equals(eventType)
                || FlowableEngineEventType.TASK_COMPLETED.name().equals(eventType)) {
            handleTaskEvent(event, eventType);
        } else if (FlowableEngineEventType.PROCESS_COMPLETED.name().equals(eventType)
                || FlowableEngineEventType.PROCESS_CANCELLED.name().equals(eventType)) {
            handleProcessEvent(event, eventType);
        }
    }

    // -----------------------------------------------------------------------
    //  Task events
    // -----------------------------------------------------------------------

    private void handleTaskEvent(FlowableEvent event, String eventType) {
        Task task = extractTask(event);
        if (task == null) return;

        String processInstanceId = task.getProcessInstanceId();
        if (processInstanceId == null) return;

        BusinessObject bo = businessObjectMapper.selectOne(
                new LambdaQueryWrapper<BusinessObject>()
                        .eq(BusinessObject::getFlowInstanceId, processInstanceId)
                        .last("LIMIT 1")
        );
        if (bo == null) {
            log.debug("No business object found for process instance {}", processInstanceId);
            return;
        }

        if (FlowableEngineEventType.TASK_CREATED.name().equals(eventType)) {
            onTaskCreated(task, bo);
        } else if (FlowableEngineEventType.TASK_COMPLETED.name().equals(eventType)) {
            onTaskCompleted(task, bo);
        }
    }

    private Task extractTask(FlowableEvent event) {
        if (event instanceof FlowableEngineEntityEvent entityEvent) {
            Object entity = entityEvent.getEntity();
            if (entity instanceof Task task) {
                return task;
            }
        }
        return null;
    }

    private void onTaskCreated(Task task, BusinessObject bo) {
        String taskId = task.getId();
        String taskName = task.getName();
        String taskDefKey = task.getTaskDefinitionKey();

        log.info("Task created: id={}, name={}, key={}, processInstance={}",
                taskId, taskName, taskDefKey, task.getProcessInstanceId());

        // Dynamic assignee resolution: if task has no assignee, resolve from config
        if (task.getAssignee() == null && taskDefKey != null) {
            try {
                ApprovalConfig config = approvalConfigMapper.selectOne(
                        new LambdaQueryWrapper<ApprovalConfig>()
                                .eq(ApprovalConfig::getProcessKey, bo.getFlowDefinitionKey())
                                .eq(ApprovalConfig::getNodeId, taskDefKey)
                                .eq(ApprovalConfig::getEnabled, true)
                                .last("LIMIT 1")
                );
                if (config != null) {
                    java.util.List<Long> assigneeIds = assigneeResolver.resolveAssignees(
                            bo.getObjectType(), bo.getFlowDefinitionKey(), taskDefKey,
                            bo.getProjectId(), bo.getApplicantId());
                    if (!assigneeIds.isEmpty()) {
                        // Set the first assignee directly
                        flowableTaskService.setAssignee(taskId, String.valueOf(assigneeIds.get(0)));
                        log.info("Assigned task {} to user {} via config", taskId, assigneeIds.get(0));
                        // Add remaining as candidate users
                        for (int i = 1; i < assigneeIds.size(); i++) {
                            flowableTaskService.addCandidateUser(taskId, String.valueOf(assigneeIds.get(i)));
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to resolve assignees for task {}: {}", taskId, e.getMessage());
            }
        }

        // Delegation check: if the current assignee has delegated their authority, reassign
        if (task.getAssignee() != null) {
            try {
                Long currentAssignee = Long.parseLong(task.getAssignee());
                Long effectiveAssignee = delegationService.resolveDelegatedApprover(currentAssignee, bo.getId());
                if (!effectiveAssignee.equals(currentAssignee)) {
                    flowableTaskService.setAssignee(taskId, String.valueOf(effectiveAssignee));
                    log.info("Task {} delegated from user {} to user {}", taskId, currentAssignee, effectiveAssignee);
                }
            } catch (NumberFormatException e) {
                log.debug("Task assignee is not numeric, skipping delegation check: {}", task.getAssignee());
            } catch (Exception e) {
                log.warn("Delegation check failed for task {}: {}", taskId, e.getMessage());
            }
        }

        bo.setCurrentTaskId(taskId);
        bo.setCurrentNode(taskName);
        bo.setUpdatedAt(LocalDateTime.now());
        businessObjectMapper.updateById(bo);

        // Send notification to the assigned user if available
        if (notificationService != null && task.getAssignee() != null) {
            try {
                Long assigneeId = Long.parseLong(task.getAssignee());
                notificationService.sendNotification(
                        assigneeId,
                        "APPROVAL",
                        "您有新的审批任务",
                        "待审批: " + bo.getObjectName(),
                        bo.getObjectType(),
                        bo.getObjectId()
                );
            } catch (NumberFormatException e) {
                log.debug("Task assignee is not a numeric user id: {}", task.getAssignee());
            } catch (Exception e) {
                log.warn("Failed to send notification for task {}: {}", taskId, e.getMessage());
            }
        }

        // Broadcast to /topic/approvals for real-time list refresh
        if (pushService != null) {
            try {
                pushService.sendToTopic("/topic/approvals",
                        java.util.Map.of("event", "TASK_CREATED", "boId", bo.getId(),
                                "objectType", bo.getObjectType(), "objectName", bo.getObjectName()));
            } catch (Exception e) {
                log.warn("Failed to broadcast approval event: {}", e.getMessage());
            }
        }
    }

    private void onTaskCompleted(Task task, BusinessObject bo) {
        log.info("Task completed: id={}, processInstance={}", task.getId(),
                task.getProcessInstanceId());
    }

    // -----------------------------------------------------------------------
    //  Process events
    // -----------------------------------------------------------------------

    private void handleProcessEvent(FlowableEvent event, String eventType) {
        String processInstanceId = null;
        if (event instanceof FlowableEngineEntityEvent entityEvent) {
            Object entity = entityEvent.getEntity();
            if (entity instanceof org.flowable.engine.runtime.ProcessInstance pi) {
                processInstanceId = pi.getProcessInstanceId();
            }
        }

        if (processInstanceId == null) {
            log.debug("Could not determine process instance id from event type {}", eventType);
            return;
        }

        BusinessObject bo = businessObjectMapper.selectOne(
                new LambdaQueryWrapper<BusinessObject>()
                        .eq(BusinessObject::getFlowInstanceId, processInstanceId)
                        .last("LIMIT 1")
        );
        if (bo == null) {
            log.debug("No business object found for process instance {}", processInstanceId);
            return;
        }

        if (FlowableEngineEventType.PROCESS_COMPLETED.name().equals(eventType)) {
            onProcessCompleted(bo);
        } else if (FlowableEngineEventType.PROCESS_CANCELLED.name().equals(eventType)) {
            onProcessCancelled(bo);
        }
    }

    @Transactional
    protected void onProcessCompleted(BusinessObject bo) {
        log.info("Process completed for business object {}", bo.getId());

        // Atomic status check: use conditional UPDATE to prevent duplicate callbacks.
        // Only proceed if status is still 2 (pending). If another thread already
        // processed this (set status to 3 or 4), the update will affect 0 rows.
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
                pushService.sendToTopic("/topic/approvals",
                        java.util.Map.of("event", "PROCESS_COMPLETED", "boId", bo.getId(),
                                "approved", approved, "objectType", bo.getObjectType()));
            } catch (Exception e) {
                log.warn("Failed to broadcast approval completion: {}", e.getMessage());
            }
        }

        // Evict dashboard cache so next request gets fresh data
        evictDashboardCache();

        // Notify CC users about the completion
        notifyCcUsers(bo, approved);
    }

    private void onProcessCancelled(BusinessObject bo) {
        log.info("Process cancelled for business object {}", bo.getId());

        bo.setCurrentTaskId(null);
        bo.setCurrentNode(null);
        bo.setStatus(5); // withdrawn
        bo.setCompletedAt(LocalDateTime.now());
        bo.setUpdatedAt(LocalDateTime.now());
        businessObjectMapper.updateById(bo);

        try {
            callbackRegistry.onWithdrawn(bo.getObjectType(), bo.getObjectId());
        } catch (Exception e) {
            log.warn("Withdrawal callback failed for business object {}: {}", bo.getId(), e.getMessage());
        }
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

    @Override
    public boolean isFailOnException() {
        return false;
    }

    @Override
    public boolean isFireOnTransactionLifecycleEvent() {
        return false;
    }

    @Override
    public String getOnTransaction() {
        return null;
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
                    new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<com.syncflow.workflow.entity.CcRecord>()
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
