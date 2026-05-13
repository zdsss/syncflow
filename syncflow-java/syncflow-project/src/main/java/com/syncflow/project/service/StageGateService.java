package com.syncflow.project.service;

import com.syncflow.project.entity.StageGate;
import com.syncflow.project.mapper.StageGateMapper;
import com.syncflow.workflow.service.WorkflowService;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * BPMN callback service for Stage Gate approvals.
 * <p>
 * Referenced by BPMN service tasks via {@code flowable:delegateExpression="${stageGateService}"}.
 */
@Service("stageGateService")
@Slf4j
public class StageGateService {

    private final StageGateMapper stageGateMapper;
    private final WorkflowService workflowService;

    public StageGateService(StageGateMapper stageGateMapper, @Lazy WorkflowService workflowService) {
        this.stageGateMapper = stageGateMapper;
        this.workflowService = workflowService;
    }

    /**
     * BPMN delegate for Stage Gate approval — NO-OP.
     * <p>
     * State changes are handled exclusively by
     * {@link com.syncflow.project.service.impl.StageGateApprovalCallback} via the
     * ApprovalCallbackRegistry (triggered by PROCESS_COMPLETED event).
     *
     * @param execution the Flowable delegate execution context
     */
    @Transactional
    public void updateStatus(DelegateExecution execution) {
        Long stageGateId = (Long) execution.getVariable("stageGateId");
        log.info("StageGate {} BPMN delegate: updateStatus (no-op, handled by StageGateApprovalCallback)", stageGateId);
    }

    /**
     * Submit a stage gate for approval. Creates the gate record and starts
     * the STAGE_GATE_APPROVAL workflow.
     *
     * @param phaseId     the phase this gate belongs to
     * @param projectId   the owning project id
     * @param applicantId the user initiating the approval
     * @return the created stage gate id
     */
    @Transactional
    public Long submitStageGate(Long phaseId, Long projectId, Long applicantId) {
        StageGate gate = new StageGate();
        gate.setPhaseId(phaseId);
        gate.setName("Stage Gate Review");
        gate.setGateType("QG");
        gate.setStatus(1); // pending
        gate.setCreatedAt(LocalDateTime.now());
        gate.setUpdatedAt(LocalDateTime.now());
        stageGateMapper.insert(gate);

        Long gateId = gate.getId();
        String gateName = gate.getName();

        Long boId = workflowService.startProcess(
                "STAGE_GATE_APPROVAL", gateId, "STAGE_GATE", gateName, projectId, applicantId);
        log.info("StageGate {} submitted for approval, businessObjectId={}", gateId, boId);

        return gateId;
    }
}
