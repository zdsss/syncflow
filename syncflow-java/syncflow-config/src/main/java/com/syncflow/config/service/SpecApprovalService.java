package com.syncflow.config.service;

import com.syncflow.config.entity.ModuleSpec;
import com.syncflow.config.mapper.ModuleSpecMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * BPMN callback service for Module Spec approval workflow.
 * <p>
 * Referenced by BPMN service tasks via {@code flowable:delegateExpression="${specApprovalService}"}.
 */
@Service("specApprovalService")
@Slf4j
@RequiredArgsConstructor
public class SpecApprovalService {

    private final ModuleSpecMapper moduleSpecMapper;

    /**
     * Called by BPMN service task when a module spec is approved.
     * Publishes the spec: sets status to 1 (PUBLISHED) and records the release timestamp.
     *
     * @param execution the Flowable delegate execution context
     */
    @Transactional
    public void publishSpec(DelegateExecution execution) {
        Long specId = (Long) execution.getVariable("businessObjectId");

        ModuleSpec spec = moduleSpecMapper.selectById(specId);
        if (spec == null) {
            log.error("ModuleSpec not found: id={}", specId);
            return;
        }

        spec.setStatus(1); // PUBLISHED
        spec.setReleaseAt(LocalDateTime.now());
        spec.setFlowInstanceId(null); // clear workflow reference
        moduleSpecMapper.updateById(spec);

        log.info("ModuleSpec {} published (status=1)", specId);
    }

    /**
     * Called by BPMN service task when a module spec approval is rejected.
     * Reverts the spec back to draft status.
     *
     * @param execution the Flowable delegate execution context
     */
    @Transactional
    public void handleRejection(DelegateExecution execution) {
        Long specId = (Long) execution.getVariable("businessObjectId");
        String rejectionReason = (String) execution.getVariable("approvalComment");

        ModuleSpec spec = moduleSpecMapper.selectById(specId);
        if (spec == null) {
            log.error("ModuleSpec not found: id={}", specId);
            return;
        }

        spec.setStatus(0); // DRAFT
        spec.setFlowInstanceId(null); // clear workflow reference
        moduleSpecMapper.updateById(spec);

        log.info("ModuleSpec {} rejected, reverted to DRAFT. Reason: {}", specId, rejectionReason);
    }
}
