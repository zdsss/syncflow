package com.syncflow.config.service.impl;

import com.syncflow.config.entity.ModuleSpec;
import com.syncflow.config.mapper.ModuleSpecMapper;
import com.syncflow.workflow.service.ApprovalCallbackHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Approval callback for module-spec first-publish.
 * <p>
 * On approval sets status to 1 (published) and records release timestamp.
 * On rejection/withdrawal reverts to status 0 (draft).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ModuleSpecApprovalCallback implements ApprovalCallbackHandler {

    private final ModuleSpecMapper moduleSpecMapper;

    @Override
    public Set<String> supportedObjectTypes() {
        return Set.of("MODULE_SPEC");
    }

    @Override
    @Transactional
    public void onApproved(Long objectId, Long approverId) {
        ModuleSpec spec = moduleSpecMapper.selectById(objectId);
        if (spec == null) {
            log.warn("ModuleSpec {} not found, skipping approval callback", objectId);
            return;
        }
        spec.setStatus(1);
        spec.setReleaseAt(LocalDateTime.now());
        spec.setFlowInstanceId(null);
        moduleSpecMapper.updateById(spec);
        log.info("ModuleSpec {} published by user {}", objectId, approverId);
    }

    @Override
    @Transactional
    public void onRejected(Long objectId, String reason) {
        ModuleSpec spec = moduleSpecMapper.selectById(objectId);
        if (spec == null) {
            log.warn("ModuleSpec {} not found, skipping rejection callback", objectId);
            return;
        }
        spec.setStatus(0);
        spec.setFlowInstanceId(null);
        moduleSpecMapper.updateById(spec);
        log.info("ModuleSpec {} approval rejected, reverted to draft: {}", objectId, reason);
    }

    @Override
    @Transactional
    public void onWithdrawn(Long objectId) {
        ModuleSpec spec = moduleSpecMapper.selectById(objectId);
        if (spec == null) {
            log.warn("ModuleSpec {} not found, skipping withdrawal callback", objectId);
            return;
        }
        spec.setStatus(0);
        spec.setFlowInstanceId(null);
        moduleSpecMapper.updateById(spec);
        log.info("ModuleSpec {} approval withdrawn, reverted to draft", objectId);
    }
}
