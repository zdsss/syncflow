package com.syncflow.project.service.impl;

import com.syncflow.project.entity.StageGate;
import com.syncflow.project.mapper.StageGateMapper;
import com.syncflow.workflow.service.ApprovalCallbackHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Approval callback for stage-gate reviews (DQR, TR, QG).
 * <p>
 * On approval sets status to 2 (approved) and records approver + timestamp.
 * On rejection/withdrawal sets status to 3 (rejected).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class StageGateApprovalCallback implements ApprovalCallbackHandler {

    private final StageGateMapper stageGateMapper;

    @Override
    public Set<String> supportedObjectTypes() {
        return Set.of("STAGE_GATE");
    }

    @Override
    @Transactional
    public void onApproved(Long objectId, Long approverId) {
        StageGate gate = stageGateMapper.selectById(objectId);
        if (gate == null) {
            log.warn("StageGate {} not found, skipping approval callback", objectId);
            return;
        }
        gate.setStatus(2);
        gate.setApproverId(approverId);
        gate.setApprovedAt(LocalDateTime.now());
        gate.setFlowInstanceId(null);
        gate.setTaskId(null);
        stageGateMapper.updateById(gate);
        log.info("StageGate {} approved by user {}", objectId, approverId);
    }

    @Override
    @Transactional
    public void onRejected(Long objectId, String reason) {
        StageGate gate = stageGateMapper.selectById(objectId);
        if (gate == null) {
            log.warn("StageGate {} not found, skipping rejection callback", objectId);
            return;
        }
        gate.setStatus(3);
        gate.setComments(reason);
        gate.setFlowInstanceId(null);
        gate.setTaskId(null);
        stageGateMapper.updateById(gate);
        log.info("StageGate {} rejected. Reason: {}", objectId, reason);
    }

    @Override
    @Transactional
    public void onWithdrawn(Long objectId) {
        StageGate gate = stageGateMapper.selectById(objectId);
        if (gate == null) {
            log.warn("StageGate {} not found, skipping withdrawal callback", objectId);
            return;
        }
        gate.setStatus(1);
        gate.setFlowInstanceId(null);
        gate.setTaskId(null);
        stageGateMapper.updateById(gate);
        log.info("StageGate {} approval withdrawn, reverted to pending", objectId);
    }
}
