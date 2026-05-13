package com.syncflow.project.service.impl;

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
 * Approval callback for milestone completion.
 * <p>
 * Registered for objectType {@code MILESTONE} in the {@link com.syncflow.workflow.service.ApprovalCallbackRegistry}.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MilestoneApprovalCallback implements ApprovalCallbackHandler {

    private final MilestoneMapper milestoneMapper;

    @Override
    public Set<String> supportedObjectTypes() {
        return Set.of("MILESTONE");
    }

    @Override
    @Transactional
    public void onApproved(Long objectId, Long approverId) {
        Milestone milestone = milestoneMapper.selectById(objectId);
        if (milestone == null) {
            log.error("Milestone not found for approval callback: {}", objectId);
            return;
        }

        milestone.setStatus(3); // completed
        milestone.setActualDate(LocalDate.now());
        milestone.setProgress(100);
        milestone.setFlowInstanceId(null); // clear workflow reference
        milestoneMapper.updateById(milestone);

        log.info("Milestone {} approved and completed", objectId);
    }

    @Override
    @Transactional
    public void onRejected(Long objectId, String reason) {
        Milestone milestone = milestoneMapper.selectById(objectId);
        if (milestone == null) {
            log.error("Milestone not found for rejection callback: {}", objectId);
            return;
        }

        milestone.setStatus(2); // back to in_progress
        milestone.setFlowInstanceId(null);
        milestoneMapper.updateById(milestone);

        log.info("Milestone {} rejected, reverted to in_progress. Reason: {}", objectId, reason);
    }

    @Override
    @Transactional
    public void onWithdrawn(Long objectId) {
        Milestone milestone = milestoneMapper.selectById(objectId);
        if (milestone == null) {
            log.error("Milestone not found for withdrawal callback: {}", objectId);
            return;
        }

        milestone.setStatus(2); // back to in_progress
        milestone.setFlowInstanceId(null);
        milestoneMapper.updateById(milestone);

        log.info("Milestone {} approval withdrawn, reverted to in_progress", objectId);
    }
}
