package com.syncflow.process.service;

import com.syncflow.process.entity.ProcessRoute;
import com.syncflow.process.mapper.ProcessRouteMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * BPMN callback service for Process Route approval workflow.
 * <p>
 * Referenced by BPMN service tasks via {@code flowable:delegateExpression="${processApprovalService}"}.
 */
@Service("processApprovalService")
@Slf4j
@RequiredArgsConstructor
public class ProcessApprovalService {

    private final ProcessRouteMapper processRouteMapper;

    /**
     * Called by BPMN service task when a process route is approved.
     * Publishes the process route: sets status to 5 (PUBLISHED).
     *
     * @param execution the Flowable delegate execution context
     */
    @Transactional
    public void publishProcess(DelegateExecution execution) {
        Long processId = (Long) execution.getVariable("objectId");

        ProcessRoute route = processRouteMapper.selectById(processId);
        if (route == null) {
            log.error("ProcessRoute not found: id={}", processId);
            return;
        }

        route.setStatus(5); // PUBLISHED
        route.setFlowInstanceId(null); // clear workflow reference
        processRouteMapper.updateById(route);

        log.info("ProcessRoute {} published (status=5)", processId);
    }

    /**
     * Called by BPMN service task when a process route approval is rejected.
     * Reverts the process route back to draft/editing status.
     *
     * @param execution the Flowable delegate execution context
     */
    @Transactional
    public void handleRejection(DelegateExecution execution) {
        Long processId = (Long) execution.getVariable("objectId");
        String rejectionReason = (String) execution.getVariable("approvalComment");

        ProcessRoute route = processRouteMapper.selectById(processId);
        if (route == null) {
            log.error("ProcessRoute not found: id={}", processId);
            return;
        }

        route.setStatus(1); // DRAFT / EDITING
        route.setFlowInstanceId(null); // clear workflow reference
        processRouteMapper.updateById(route);

        log.info("ProcessRoute {} rejected, reverted to DRAFT. Reason: {}", processId, rejectionReason);
    }
}
