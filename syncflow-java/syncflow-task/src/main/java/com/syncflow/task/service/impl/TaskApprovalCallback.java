package com.syncflow.task.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.project.entity.Project;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.task.entity.Task;
import com.syncflow.task.enums.TaskStatus;
import com.syncflow.task.mapper.TaskMapper;
import com.syncflow.project.entity.Milestone;
import com.syncflow.project.mapper.MilestoneMapper;
import com.syncflow.workflow.service.ApprovalCallbackHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Set;

/**
 * Approval callback for task completion (TASK, ISSUE, RISK).
 * <p>
 * MILESTONE is handled by {@code MilestoneApprovalCallback} in syncflow-project.
 * Registered in {@link com.syncflow.workflow.service.ApprovalCallbackRegistry}.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TaskApprovalCallback implements ApprovalCallbackHandler {

    private final TaskMapper taskMapper;
    private final ProjectMapper projectMapper;
    private final MilestoneMapper milestoneMapper;

    @Override
    public Set<String> supportedObjectTypes() {
        return Set.of("TASK", "ISSUE", "RISK");
    }

    @Override
    @Transactional
    public void onApproved(Long objectId, Long approverId) {
        Task task = taskMapper.selectById(objectId);
        if (task == null) {
            log.error("Task not found for approval callback: {}", objectId);
            return;
        }

        // Guard: don't complete a cancelled or already-completed task
        if (task.getStatus() == TaskStatus.CANCELLED.getCode()
                || task.getStatus() == TaskStatus.COMPLETED.getCode()) {
            log.warn("Task {} has status {}, skipping approval completion", objectId, task.getStatus());
            return;
        }

        task.setStatus(TaskStatus.COMPLETED.getCode());
        task.setProgress(100);
        task.setActualEnd(LocalDate.now());
        task.setFlowInstanceId(null);
        task.setTaskIdInFlow(null);
        taskMapper.updateById(task);

        syncLinkedMilestone(task, true);
        recalcProjectProgress(task.getProjectId());

        log.info("Task {} approved and completed", objectId);
    }

    @Override
    @Transactional
    public void onRejected(Long objectId, String reason) {
        Task task = taskMapper.selectById(objectId);
        if (task == null) {
            log.error("Task not found for rejection callback: {}", objectId);
            return;
        }

        // Only revert if task is still in PENDING_REVIEW (guard against race condition
        // where user manually changed status during approval)
        if (task.getStatus() != TaskStatus.PENDING_REVIEW.getCode()) {
            log.warn("Task {} status is {} (not PENDING_REVIEW), skipping rejection revert",
                    objectId, task.getStatus());
            task.setFlowInstanceId(null);
            task.setTaskIdInFlow(null);
            taskMapper.updateById(task);
            return;
        }

        task.setStatus(TaskStatus.IN_PROGRESS.getCode());
        task.setFlowInstanceId(null);
        task.setTaskIdInFlow(null);
        taskMapper.updateById(task);

        syncLinkedMilestone(task, false);

        log.info("Task {} rejected, reverted to in_progress. Reason: {}", objectId, reason);
    }

    @Override
    @Transactional
    public void onWithdrawn(Long objectId) {
        Task task = taskMapper.selectById(objectId);
        if (task == null) {
            log.error("Task not found for withdrawal callback: {}", objectId);
            return;
        }

        task.setStatus(TaskStatus.IN_PROGRESS.getCode());
        task.setFlowInstanceId(null);
        task.setTaskIdInFlow(null);
        taskMapper.updateById(task);

        syncLinkedMilestone(task, false);

        log.info("Task {} approval withdrawn, reverted to in_progress", objectId);
    }

    private void syncLinkedMilestone(Task task, boolean completed) {
        if (task.getMilestoneId() == null) return;
        Milestone milestone = milestoneMapper.selectById(task.getMilestoneId());
        if (milestone == null) return;

        if (completed) {
            milestone.setStatus(3); // completed
            milestone.setActualDate(LocalDate.now());
            milestone.setProgress(100);
        } else {
            milestone.setStatus(2); // in_progress
        }
        milestone.setFlowInstanceId(null);
        milestoneMapper.updateById(milestone);
        log.debug("Synced linked milestone {} to status {}", task.getMilestoneId(), milestone.getStatus());
    }

    private void recalcProjectProgress(Long projectId) {
        if (projectId == null) return;
        Project project = projectMapper.selectById(projectId);
        if (project == null) return;

        long total = taskMapper.selectCount(new LambdaQueryWrapper<Task>()
                .eq(Task::getProjectId, projectId)
                .ne(Task::getStatus, TaskStatus.CANCELLED.getCode()));
        if (total == 0) return;

        // Count both COMPLETED and PENDING_REVIEW as "done" for progress calculation
        // PENDING_REVIEW means work is finished, just awaiting approval sign-off
        long done = taskMapper.selectCount(new LambdaQueryWrapper<Task>()
                .eq(Task::getProjectId, projectId)
                .in(Task::getStatus, TaskStatus.COMPLETED.getCode(), TaskStatus.PENDING_REVIEW.getCode()));

        int progress = (int) Math.round((done * 100.0) / total);
        project.setProgress(progress);
        projectMapper.updateById(project);
        log.debug("Recalculated project {} progress after approval: {}/{} = {}%", projectId, done, total, progress);
    }
}
