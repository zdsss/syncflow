package com.syncflow.workflow.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.workflow.dto.ApprovalCommentVO;
import com.syncflow.workflow.dto.ApprovalTaskVO;
import com.syncflow.workflow.dto.BusinessObjectVO;
import com.syncflow.workflow.entity.ApprovalComment;
import com.syncflow.workflow.entity.ApprovalConfig;
import com.syncflow.workflow.entity.BusinessObject;
import com.syncflow.workflow.mapper.ApprovalCommentMapper;
import com.syncflow.workflow.mapper.ApprovalConfigMapper;
import com.syncflow.workflow.mapper.BusinessObjectMapper;
import com.syncflow.workflow.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.HistoryService;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.repository.ProcessDefinition;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Real Flowable-powered implementation of {@link WorkflowService}.
 * <p>
 * This implementation delegates process lifecycle operations to the Flowable 7.x
 * engine while keeping the {@code wf_business_object} binding table in sync.
 * The {@link com.syncflow.workflow.listener.ApprovalEventListener} handles
 * real-time updates to the BusinessObject as Flowable events fire.
 *
 * <p><b>Status values:</b>
 * <ul>
 *   <li>1 = draft</li>
 *   <li>2 = pending approval (审批中)</li>
 *   <li>3 = approved (已通过)</li>
 *   <li>4 = rejected (已驳回)</li>
 *   <li>5 = withdrawn (已撤回)</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WorkflowServiceImpl implements WorkflowService {

    private final RuntimeService runtimeService;
    private final TaskService taskService;
    private final RepositoryService repositoryService;
    private final HistoryService historyService;
    private final BusinessObjectMapper businessObjectMapper;
    private final ApprovalCommentMapper approvalCommentMapper;
    private final ApprovalConfigMapper approvalConfigMapper;
    private final com.syncflow.workflow.service.ApprovalAssigneeResolver assigneeResolver;
    private final com.syncflow.workflow.mapper.CrossModuleMapper crossModuleMapper;
    @org.springframework.context.annotation.Lazy
    private final com.syncflow.workflow.service.CcRecordService ccRecordService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.syncflow.message.service.NotificationService notificationService;

    @Override
    @Transactional
    public Long startProcess(String processKey, Long objectId, String objectType,
                             String objectName, Long projectId, Long applicantId) {
        return startProcess(processKey, objectId, objectType, objectName, projectId, applicantId, null);
    }

    @Override
    @Transactional
    public Long startProcess(String processKey, Long objectId, String objectType,
                             String objectName, Long projectId, Long applicantId,
                             java.util.List<Long> ccUserIds) {

        // 1. Idempotency guard: reject if a pending approval already exists for this object
        BusinessObject existing = businessObjectMapper.selectOne(
                new LambdaQueryWrapper<BusinessObject>()
                        .eq(BusinessObject::getObjectType, objectType)
                        .eq(BusinessObject::getObjectId, objectId)
                        .eq(BusinessObject::getStatus, 2) // pending
                        .last("LIMIT 1")
        );
        if (existing != null) {
            log.warn("Duplicate approval attempt blocked: objectType={}, objectId={}, existingBoId={}",
                    objectType, objectId, existing.getId());
            throw new BusinessException(ErrorCode.APPROVAL_ALREADY_DONE,
                    "该对象已有进行中的审批流程，请勿重复提交");
        }

        // 2. Create the business object record
        BusinessObject bo = new BusinessObject();
        bo.setObjectType(objectType);
        bo.setObjectId(objectId);
        bo.setObjectName(objectName);
        bo.setProjectId(projectId);
        bo.setStatus(2); // pending approval
        bo.setFlowDefinitionKey(processKey);
        bo.setApplicantId(applicantId);
        bo.setAppliedAt(LocalDateTime.now());
        bo.setTenantId(1L);
        bo.setCreatedAt(LocalDateTime.now());
        bo.setUpdatedAt(LocalDateTime.now());

        // Resolve the process definition version
        ProcessDefinition pd = repositoryService.createProcessDefinitionQuery()
                .processDefinitionKey(processKey)
                .latestVersion()
                .singleResult();
        if (pd != null) {
            bo.setFlowDefinitionId(pd.getId());
            bo.setFlowVersion(pd.getVersion());
        }

        businessObjectMapper.insert(bo);

        // 3. Create CC records if provided
        if (ccUserIds != null && !ccUserIds.isEmpty()) {
            try {
                for (Long ccUserId : ccUserIds) {
                    ccRecordService.addCc(bo.getId(), ccUserId);
                }
            } catch (Exception e) {
                log.warn("Failed to create CC records for business object {}: {}", bo.getId(), e.getMessage());
            }
        }

        // 3. Build the process variables
        String businessKey = String.valueOf(bo.getId());
        Map<String, Object> variables = new HashMap<>();
        variables.put("businessObjectId", bo.getId());
        variables.put("objectType", objectType);
        variables.put("objectName", objectName);
        variables.put("objectId", objectId);
        variables.put("projectId", projectId);
        variables.put("applicantId", String.valueOf(applicantId));
        // Alias for domain-specific references (e.g., StageGate BPMN reads stageGateId)
        if ("STAGE_GATE".equals(objectType)) {
            variables.put("stageGateId", objectId);
        }

        // Resolve approval assignees from wf_approval_config
        List<ApprovalConfig> configs = approvalConfigMapper.selectList(
                new LambdaQueryWrapper<ApprovalConfig>()
                        .eq(ApprovalConfig::getProcessKey, processKey)
                        .eq(ApprovalConfig::getEnabled, true)
                        .orderByAsc(ApprovalConfig::getPriority)
        );

        boolean anyAssigneeResolved = false;
        for (ApprovalConfig config : configs) {
            List<Long> assigneeIds = assigneeResolver.resolveAssignees(
                    objectType, processKey, config.getNodeId(), projectId, applicantId);
            if (!assigneeIds.isEmpty()) {
                // Use nodeId + "Ids" as variable name (e.g., techReview → techReviewIds)
                String varName = config.getNodeId() + "Ids";
                variables.put(varName, assigneeIds.stream()
                        .map(String::valueOf).collect(Collectors.joining(",")));
                log.debug("Resolved assignees for node {}: {}", config.getNodeId(), assigneeIds);
                anyAssigneeResolved = true;
            } else {
                log.warn("No assignees resolved for node '{}' (processKey={}, objectType={}, projectId={})",
                        config.getNodeId(), processKey, objectType, projectId);
            }
        }

        if (!configs.isEmpty() && !anyAssigneeResolved) {
            log.warn("No assignees resolved for any node in process '{}' — approval may hang. " +
                    "Check wf_approval_config and project member roles.", processKey);
        }

        // 3. Start the Flowable process instance
        ProcessInstance pi = runtimeService.startProcessInstanceByKey(
                processKey, businessKey, variables);

        log.info("Flowable process started: processKey={}, instanceId={}, businessKey={}",
                processKey, pi.getId(), businessKey);

        // 4. Auto-complete the applicant's "submit" task so the workflow advances to the first reviewer
        Task firstTask = taskService.createTaskQuery()
                .processInstanceId(pi.getId())
                .active()
                .singleResult();

        if (firstTask != null && String.valueOf(applicantId).equals(firstTask.getAssignee())) {
            taskService.complete(firstTask.getId(), Map.of("approved", true));
            log.info("Auto-completed submit task '{}' for applicant {}", firstTask.getName(), applicantId);

            // Get the actual first reviewer task
            firstTask = taskService.createTaskQuery()
                    .processInstanceId(pi.getId())
                    .active()
                    .singleResult();
        }

        // 5. Update the business object with the real flow instance id and task
        bo.setFlowInstanceId(pi.getId());
        if (firstTask != null) {
            bo.setCurrentTaskId(firstTask.getId());
            bo.setCurrentNode(firstTask.getName());
            variables.put("nodeName", firstTask.getName());
        }
        businessObjectMapper.updateById(bo);

        log.info("Started approval process [{}] for {}:{} (BO id={}, flowInstanceId={})",
                processKey, objectType, objectId, bo.getId(), pi.getId());

        return bo.getId();
    }

    @Override
    @Transactional
    public void completeTask(String taskId, Long approverId, boolean approved, String comment) {

        // 1. Find the business object by currentTaskId
        BusinessObject bo = businessObjectMapper.selectOne(
                new LambdaQueryWrapper<BusinessObject>()
                        .eq(BusinessObject::getCurrentTaskId, taskId)
                        .last("LIMIT 1")
        );
        if (bo == null) {
            throw new BusinessException(ErrorCode.APPROVAL_TASK_NOT_FOUND,
                    "No business object found for task id: " + taskId);
        }
        if (bo.getStatus() != 2) {
            throw new BusinessException(ErrorCode.APPROVAL_ALREADY_DONE,
                    "Approval has already been processed for business object: " + bo.getId());
        }

        // 2. Record the approval comment first
        ApprovalComment ac = new ApprovalComment();
        ac.setBusinessObjectId(bo.getId());
        ac.setTaskId(taskId);
        ac.setNodeName(bo.getCurrentNode());
        ac.setApproverId(approverId);
        String approverRealName = approverId != null ? crossModuleMapper.selectUserRealName(approverId) : null;
        ac.setApproverName(approverRealName != null ? approverRealName : String.valueOf(approverId));
        ac.setAction(approved ? "APPROVE" : "REJECT");
        ac.setComment(comment);
        ac.setCreatedAt(LocalDateTime.now());
        approvalCommentMapper.insert(ac);

        // 3. Complete the Flowable task with variables
        Map<String, Object> variables = new HashMap<>();
        variables.put("approved", approved);
        variables.put("approverId", approverId);
        variables.put("approvalComment", comment);
        variables.put("approvalTimestamp", LocalDateTime.now().toString());

        taskService.complete(taskId, variables);

        log.info("Task {} completed by user {} — approved={}", taskId, approverId, approved);

        // Note: BusinessObject status updates are handled by the
        // ApprovalEventListener (PROCESS_COMPLETED / TASK_CREATED events)
        // and the BPMN service tasks defined in the process definitions.
    }

    @Override
    public List<ApprovalTaskVO> getPendingTasks(Long userId) {
        String userIdStr = String.valueOf(userId);

        // 1. Query Flowable for tasks assigned to or claimed by this user
        List<Task> tasks = taskService.createTaskQuery()
                .or()
                .taskAssignee(userIdStr)
                .taskCandidateUser(userIdStr)
                .endOr()
                .active()
                .orderByTaskCreateTime()
                .desc()
                .list();

        // 2. For each task, look up the BusinessObject for context
        List<ApprovalTaskVO> result = new ArrayList<>();
        for (Task task : tasks) {
            String processInstanceId = task.getProcessInstanceId();

            // Find the business object by flowInstanceId
            BusinessObject bo = businessObjectMapper.selectOne(
                    new LambdaQueryWrapper<BusinessObject>()
                            .eq(BusinessObject::getFlowInstanceId, processInstanceId)
                            .last("LIMIT 1")
            );
            if (bo == null) {
                log.debug("No business object found for process instance {}, skipping task {}",
                        processInstanceId, task.getId());
                continue;
            }

            ApprovalTaskVO vo = new ApprovalTaskVO();
            vo.setTaskId(task.getId());
            vo.setTaskName(task.getName());
            vo.setBusinessObjectId(bo.getId());
            vo.setObjectType(bo.getObjectType());
            vo.setObjectName(bo.getObjectName());
            vo.setObjectCode(bo.getObjectCode());
            vo.setProjectId(bo.getProjectId());
            // Resolve applicant real name
            String applicantName = bo.getApplicantId() != null
                    ? crossModuleMapper.selectUserRealName(bo.getApplicantId())
                    : null;
            vo.setApplicantName(applicantName != null ? applicantName : String.valueOf(bo.getApplicantId()));
            vo.setCreatedAt(task.getCreateTime() != null ?
                    task.getCreateTime().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null);
            result.add(vo);
        }
        return result;
    }

    @Override
    public List<ApprovalTaskVO> getCompletedTasks(Long userId) {
        String userIdStr = String.valueOf(userId);

        // Query Flowable history for tasks completed by this user
        var historicTasks = historyService.createHistoricTaskInstanceQuery()
                .taskAssignee(userIdStr)
                .finished()
                .orderByHistoricTaskInstanceEndTime()
                .desc()
                .listPage(0, 50);

        List<ApprovalTaskVO> result = new ArrayList<>();
        for (var task : historicTasks) {
            String processInstanceId = task.getProcessInstanceId();

            BusinessObject bo = businessObjectMapper.selectOne(
                    new LambdaQueryWrapper<BusinessObject>()
                            .eq(BusinessObject::getFlowInstanceId, processInstanceId)
                            .last("LIMIT 1"));
            if (bo == null) continue;

            ApprovalTaskVO vo = new ApprovalTaskVO();
            vo.setTaskId(task.getId());
            vo.setTaskName(task.getName());
            vo.setBusinessObjectId(bo.getId());
            vo.setObjectType(bo.getObjectType());
            vo.setObjectName(bo.getObjectName());
            vo.setObjectCode(bo.getObjectCode());
            vo.setProjectId(bo.getProjectId());
            String applicantName = bo.getApplicantId() != null
                    ? crossModuleMapper.selectUserRealName(bo.getApplicantId())
                    : null;
            vo.setApplicantName(applicantName != null ? applicantName : String.valueOf(bo.getApplicantId()));
            vo.setCreatedAt(task.getCreateTime() != null ?
                    task.getCreateTime().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null);
            result.add(vo);
        }
        return result;
    }

    @Override
    public List<ApprovalCommentVO> getApprovalHistory(Long businessObjectId) {

        List<ApprovalComment> comments = approvalCommentMapper.selectList(
                new LambdaQueryWrapper<ApprovalComment>()
                        .eq(ApprovalComment::getBusinessObjectId, businessObjectId)
                        .orderByAsc(ApprovalComment::getCreatedAt)
        );

        return comments.stream().map(c -> {
            ApprovalCommentVO vo = new ApprovalCommentVO();
            vo.setId(c.getId());
            vo.setNodeName(c.getNodeName());
            vo.setApproverName(c.getApproverName());
            vo.setAction(c.getAction());
            vo.setComment(c.getComment());
            vo.setCreatedAt(c.getCreatedAt());
            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public BusinessObjectVO getBusinessObject(Long id) {

        BusinessObject bo = businessObjectMapper.selectById(id);
        if (bo == null) {
            return null;
        }
        return toVO(bo);
    }

    @Override
    public BusinessObject getBusinessObjectEntity(Long id) {
        return businessObjectMapper.selectById(id);
    }

    @Override
    public BusinessObject findBusinessObject(String objectType, Long objectId) {
        return businessObjectMapper.selectOne(
                new LambdaQueryWrapper<BusinessObject>()
                        .eq(BusinessObject::getObjectType, objectType)
                        .eq(BusinessObject::getObjectId, objectId)
                        .eq(BusinessObject::getStatus, 2)
                        .last("LIMIT 1")
        );
    }

    @Override
    @Transactional
    public void withdrawApproval(Long businessObjectId, Long userId) {

        BusinessObject bo = businessObjectMapper.selectById(businessObjectId);
        if (bo == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Business object not found: " + businessObjectId);
        }
        if (!userId.equals(bo.getApplicantId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Only the applicant can withdraw the approval");
        }
        if (bo.getStatus() != 2) {
            throw new BusinessException(ErrorCode.APPROVAL_ALREADY_DONE,
                    "Cannot withdraw: current status is " + bo.getStatus());
        }

        // Delete the Flowable process instance — this fires PROCESS_CANCELLED which
        // triggers ApprovalEventListener.onProcessCancelled() to update status and invoke callbacks.
        if (bo.getFlowInstanceId() != null) {
            runtimeService.deleteProcessInstance(bo.getFlowInstanceId(), "withdrawn by applicant");
        }

        // Reload to verify the listener updated the status (CAS guard)
        BusinessObject updated = businessObjectMapper.selectById(businessObjectId);
        if (updated != null && updated.getStatus() != 5) {
            // Listener didn't fire (e.g., process already terminated) — update manually
            updated.setStatus(5);
            updated.setCompletedAt(LocalDateTime.now());
            updated.setCompletedBy(userId);
            updated.setCurrentTaskId(null);
            updated.setCurrentNode(null);
            updated.setUpdatedAt(LocalDateTime.now());
            businessObjectMapper.updateById(updated);
        } else if (updated != null && updated.getCompletedBy() == null) {
            // Listener set status but not completedBy — patch it
            updated.setCompletedBy(userId);
            businessObjectMapper.updateById(updated);
        }

        log.info("Approval withdrawn by user {} for business object {}", userId, businessObjectId);
    }

    @Override
    public void withdrawByFlowInstanceId(String flowInstanceId) {
        if (flowInstanceId == null) return;

        BusinessObject bo = businessObjectMapper.selectOne(
                new LambdaQueryWrapper<BusinessObject>().eq(BusinessObject::getFlowInstanceId, flowInstanceId));
        if (bo == null || bo.getStatus() != 2) {
            // Already completed or not found — just delete the process instance
            try {
                runtimeService.deleteProcessInstance(flowInstanceId, "orphan cleanup: task manually completed");
            } catch (Exception e) {
                log.debug("Process instance {} already terminated: {}", flowInstanceId, e.getMessage());
            }
            return;
        }

        try {
            runtimeService.deleteProcessInstance(flowInstanceId, "orphan cleanup: task manually completed");
        } catch (Exception e) {
            log.debug("Process instance {} already terminated: {}", flowInstanceId, e.getMessage());
        }

        bo.setStatus(5); // withdrawn
        bo.setCompletedAt(LocalDateTime.now());
        bo.setCurrentTaskId(null);
        bo.setCurrentNode(null);
        bo.setUpdatedAt(LocalDateTime.now());
        businessObjectMapper.updateById(bo);

        log.info("Orphaned approval withdrawn for flow instance {}", flowInstanceId);
    }

    @Override
    public void remindApproval(Long businessObjectId, Long userId) {
        BusinessObject bo = businessObjectMapper.selectById(businessObjectId);
        if (bo == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Business object not found: " + businessObjectId);
        }
        if (!userId.equals(bo.getApplicantId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Only the applicant can send reminders");
        }
        if (bo.getStatus() != 2) {
            throw new BusinessException(ErrorCode.APPROVAL_ALREADY_DONE,
                    "Cannot remind: approval is no longer pending");
        }

        // Find the current active task assignee and send a reminder via Flowable task comment
        if (bo.getFlowInstanceId() != null) {
            List<org.flowable.task.api.Task> activeTasks = taskService.createTaskQuery()
                    .processInstanceId(bo.getFlowInstanceId())
                    .active()
                    .list();
            for (org.flowable.task.api.Task task : activeTasks) {
                String assignee = task.getAssignee();
                if (assignee != null) {
                    taskService.addComment(task.getId(), bo.getFlowInstanceId(),
                            "REMINDER", "催办提醒：请尽快处理审批 - " + bo.getObjectName());
                    // Send push notification to the assignee
                    if (notificationService != null) {
                        try {
                            notificationService.sendNotification(
                                    Long.parseLong(assignee),
                                    "APPROVAL_REMINDER",
                                    "审批催办",
                                    "您有一条待处理审批：" + bo.getObjectName() + "，请尽快处理",
                                    bo.getObjectType(),
                                    bo.getObjectId()
                            );
                        } catch (Exception e) {
                            log.warn("Failed to send reminder notification to assignee {}: {}", assignee, e.getMessage());
                        }
                    }
                }
            }
        }

        log.info("Approval reminder sent by user {} for business object {}", userId, businessObjectId);
    }

    @Override
    public void addCandidateUser(String taskId, Long candidateUserId) {
        org.flowable.task.api.Task task = taskService.createTaskQuery()
                .taskId(taskId)
                .active()
                .singleResult();
        if (task == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Active task not found: " + taskId);
        }
        taskService.addCandidateUser(taskId, String.valueOf(candidateUserId));
        taskService.addComment(taskId, task.getProcessInstanceId(),
                "ADD_SIGNER", "加签用户: " + candidateUserId);
        log.info("Added candidate user {} to task {}", candidateUserId, taskId);
    }

    @Override
    public boolean isApprovalRequired(String objectType) {
        if (objectType == null) return false;
        com.syncflow.workflow.entity.ApprovalConfig config = approvalConfigMapper.selectOne(
                new LambdaQueryWrapper<com.syncflow.workflow.entity.ApprovalConfig>()
                        .eq(com.syncflow.workflow.entity.ApprovalConfig::getObjectType, objectType)
                        .eq(com.syncflow.workflow.entity.ApprovalConfig::getEnabled, true)
        );
        return config != null;
    }

    @Override
    public void reassignTask(String taskId, Long newUserId) {
        org.flowable.task.api.Task task = taskService.createTaskQuery()
                .taskId(taskId)
                .active()
                .singleResult();
        if (task == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Active task not found: " + taskId);
        }
        String previousAssignee = task.getAssignee();
        taskService.setAssignee(taskId, String.valueOf(newUserId));
        taskService.addComment(taskId, task.getProcessInstanceId(),
                "TRANSFER", "审批转交：从用户 " + previousAssignee + " 转交至用户 " + newUserId);
        log.info("Task {} reassigned from {} to {}", taskId, previousAssignee, newUserId);
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    private BusinessObjectVO toVO(BusinessObject bo) {
        BusinessObjectVO vo = new BusinessObjectVO();
        vo.setId(bo.getId());
        vo.setObjectType(bo.getObjectType());
        vo.setObjectId(bo.getObjectId());
        vo.setObjectName(bo.getObjectName());
        vo.setObjectCode(bo.getObjectCode());
        vo.setProjectId(bo.getProjectId());
        vo.setStatus(bo.getStatus());
        vo.setCurrentNode(bo.getCurrentNode());
        vo.setCurrentTaskId(bo.getCurrentTaskId());
        vo.setFlowDefinitionId(bo.getFlowDefinitionId());
        vo.setFlowDefinitionKey(bo.getFlowDefinitionKey());
        vo.setFlowVersion(bo.getFlowVersion());
        vo.setFlowInstanceId(bo.getFlowInstanceId());
        vo.setApplicantId(bo.getApplicantId());
        // Resolve applicant real name
        String applicantName = bo.getApplicantId() != null
                ? crossModuleMapper.selectUserRealName(bo.getApplicantId())
                : null;
        vo.setApplicantName(applicantName != null ? applicantName : String.valueOf(bo.getApplicantId()));
        vo.setAppliedAt(bo.getAppliedAt());
        vo.setCompletedAt(bo.getCompletedAt());
        vo.setCompletedBy(bo.getCompletedBy());
        vo.setTenantId(bo.getTenantId());
        vo.setCreatedAt(bo.getCreatedAt());
        vo.setUpdatedAt(bo.getUpdatedAt());
        return vo;
    }
}
