package com.syncflow.workflow.service.impl;

import com.syncflow.workflow.entity.ChangeRequest;
import com.syncflow.workflow.mapper.ChangeRequestMapper;
import com.syncflow.workflow.service.ApprovalCallbackHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Approval callback for generic CHANGE approval (objectType=CHANGE).
 * <p>
 * This handles the base change-request lifecycle. Domain-specific change
 * callbacks (BOM_CHANGE, PROCESS_CHANGE, SPEC_CHANGE) apply mutations;
 * this callback simply marks the change request as applied or rejected.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ChangeRequestApprovalCallback implements ApprovalCallbackHandler {

    private final ChangeRequestMapper changeRequestMapper;

    @Override
    public Set<String> supportedObjectTypes() {
        return Set.of("CHANGE");
    }

    @Override
    @Transactional
    public void onApproved(Long objectId, Long approverId) {
        ChangeRequest cr = changeRequestMapper.selectById(objectId);
        if (cr == null) {
            log.warn("ChangeRequest {} not found, skipping approval callback", objectId);
            return;
        }
        cr.setStatus(2);
        cr.setResolvedBy(approverId);
        cr.setResolvedAt(LocalDateTime.now());
        changeRequestMapper.updateById(cr);
        log.info("ChangeRequest {} approved by user {}", objectId, approverId);
    }

    @Override
    @Transactional
    public void onRejected(Long objectId, String reason) {
        ChangeRequest cr = changeRequestMapper.selectById(objectId);
        if (cr == null) {
            log.warn("ChangeRequest {} not found, skipping rejection callback", objectId);
            return;
        }
        cr.setStatus(3);
        cr.setResolvedAt(LocalDateTime.now());
        changeRequestMapper.updateById(cr);
        log.info("ChangeRequest {} rejected. Reason: {}", objectId, reason);
    }

    @Override
    @Transactional
    public void onWithdrawn(Long objectId) {
        ChangeRequest cr = changeRequestMapper.selectById(objectId);
        if (cr == null) {
            log.warn("ChangeRequest {} not found, skipping withdrawal callback", objectId);
            return;
        }
        cr.setStatus(3);
        cr.setResolvedAt(LocalDateTime.now());
        changeRequestMapper.updateById(cr);
        log.info("ChangeRequest {} withdrawn", objectId);
    }
}
