package com.syncflow.bom.service;

import com.syncflow.bom.entity.Bom;
import com.syncflow.bom.mapper.BomMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * BPMN callback service for BOM approval workflow.
 * <p>
 * Referenced by BPMN service tasks via {@code flowable:delegateExpression="${bomApprovalService}"}.
 */
@Service("bomApprovalService")
@Slf4j
@RequiredArgsConstructor
public class BomApprovalService {

    private final BomMapper bomMapper;

    /**
     * BPMN delegate for BOM approval — NO-OP.
     * <p>
     * State changes are handled exclusively by
     * {@link com.syncflow.bom.service.impl.BomApprovalCallback} via the
     * ApprovalCallbackRegistry (triggered by PROCESS_COMPLETED event).
     *
     * @param execution the Flowable delegate execution context
     */
    @Transactional
    public void publishBom(DelegateExecution execution) {
        Long bomId = (Long) execution.getVariable("businessObjectId");
        log.info("BOM {} BPMN delegate: publishBom (no-op, handled by BomApprovalCallback)", bomId);
    }

    /**
     * BPMN delegate for BOM rejection — NO-OP.
     * <p>
     * State changes are handled exclusively by
     * {@link com.syncflow.bom.service.impl.BomApprovalCallback} via the
     * ApprovalCallbackRegistry (triggered by PROCESS_COMPLETED event).
     *
     * @param execution the Flowable delegate execution context
     */
    @Transactional
    public void handleRejection(DelegateExecution execution) {
        Long bomId = (Long) execution.getVariable("businessObjectId");
        log.info("BOM {} BPMN delegate: handleRejection (no-op, handled by BomApprovalCallback)", bomId);
    }
}
