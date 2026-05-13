package com.syncflow.workflow.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.workflow.entity.BusinessObject;
import com.syncflow.workflow.mapper.BusinessObjectMapper;
import com.syncflow.workflow.mapper.CrossModuleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.TaskService;
import org.flowable.task.api.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled service that detects stale (long-pending) approvals and sends
 * reminder notifications to the current assignee and applicant.
 * <p>
 * Runs every 4 hours. Sends a reminder if an approval has been pending for
 * more than 48 hours since submission or last reminder.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class StaleApprovalReminderService {

    private static final int STALE_HOURS = 48;
    private static final int MAX_REMINDERS = 5;

    private final BusinessObjectMapper businessObjectMapper;
    private final CrossModuleMapper crossModuleMapper;
    private final TaskService taskService;

    @Autowired(required = false)
    private com.syncflow.message.service.NotificationService notificationService;

    @Scheduled(cron = "0 0 */4 * * ?")
    public void checkStaleApprovals() {
        if (notificationService == null) {
            return;
        }

        LocalDateTime threshold = LocalDateTime.now().minusHours(STALE_HOURS);

        List<BusinessObject> staleApprovals = businessObjectMapper.selectList(
                new LambdaQueryWrapper<BusinessObject>()
                        .eq(BusinessObject::getStatus, 2)
                        .lt(BusinessObject::getAppliedAt, threshold)
                        .and(w -> w
                                .isNull(BusinessObject::getLastRemindedAt)
                                .or()
                                .lt(BusinessObject::getLastRemindedAt, threshold)
                        )
                        .lt(BusinessObject::getReminderCount, MAX_REMINDERS)
        );

        if (staleApprovals.isEmpty()) {
            return;
        }

        log.info("Found {} stale approvals pending > {}h, sending reminders", staleApprovals.size(), STALE_HOURS);

        for (BusinessObject bo : staleApprovals) {
            try {
                sendReminder(bo);
                bo.setReminderCount(bo.getReminderCount() != null ? bo.getReminderCount() + 1 : 1);
                bo.setLastRemindedAt(LocalDateTime.now());
                businessObjectMapper.updateById(bo);
            } catch (Exception e) {
                log.warn("Failed to send reminder for business object {}: {}", bo.getId(), e.getMessage());
            }
        }
    }

    private void sendReminder(BusinessObject bo) {
        String objectName = bo.getObjectName() != null ? bo.getObjectName() : "审批项#" + bo.getId();
        long pendingHours = java.time.Duration.between(bo.getAppliedAt(), LocalDateTime.now()).toHours();

        // Notify the current task assignee from Flowable
        if (bo.getFlowInstanceId() != null) {
            try {
                List<Task> activeTasks = taskService.createTaskQuery()
                        .processInstanceId(bo.getFlowInstanceId())
                        .active()
                        .list();
                for (Task task : activeTasks) {
                    String assignee = task.getAssignee();
                    if (assignee != null) {
                        notificationService.sendNotification(
                                Long.parseLong(assignee),
                                "APPROVAL_REMINDER",
                                "审批催办",
                                "您有一条待处理审批 [" + objectName + "]，已等待 " + pendingHours + " 小时，请尽快处理",
                                bo.getObjectType(),
                                bo.getObjectId()
                        );
                    }
                }
            } catch (Exception e) {
                log.debug("Failed to notify assignee for stale approval: {}", e.getMessage());
            }
        }

        // Also notify the applicant that their approval is still pending
        if (bo.getApplicantId() != null) {
            try {
                notificationService.sendNotification(
                        bo.getApplicantId(),
                        "APPROVAL_REMINDER",
                        "审批提醒",
                        "您提交的 [" + objectName + "] 已等待审批 " + pendingHours + " 小时",
                        bo.getObjectType(),
                        bo.getObjectId()
                );
            } catch (Exception e) {
                log.debug("Failed to send reminder to applicant: {}", e.getMessage());
            }
        }
    }
}
