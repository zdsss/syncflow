package com.syncflow.workflow.service;

import com.syncflow.workflow.entity.ChangeRequest;
import com.syncflow.workflow.mapper.ChangeRequestMapper;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.flowable.engine.delegate.JavaDelegate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * BPMN service-task delegate for the CHANGE_APPROVAL process.
 * <p>
 * Implements {@link JavaDelegate} so Flowable can invoke it via
 * {@code flowable:delegateExpression="${changeApprovalService}"}.
 * <p>
 * On approval: marks the ChangeRequest as applied and delegates to
 * {@link ApprovalCallbackRegistry} to apply the change data to the target entity.
 * On rejection: marks the ChangeRequest as rejected.
 */
@Service("changeApprovalService")
@Slf4j
public class ChangeApprovalService implements JavaDelegate {

    private final ChangeRequestMapper changeRequestMapper;
    private final ApprovalCallbackRegistry callbackRegistry;

    public ChangeApprovalService(ChangeRequestMapper changeRequestMapper,
                                  ApprovalCallbackRegistry callbackRegistry) {
        this.changeRequestMapper = changeRequestMapper;
        this.callbackRegistry = callbackRegistry;
    }

    @Override
    @Transactional
    public void execute(DelegateExecution execution) {
        Long crId = getLongVariable(execution, "objectId");
        if (crId == null) {
            crId = getLongVariable(execution, "changeRequestId");
        }
        if (crId == null) {
            log.error("No change request id found in process variables");
            return;
        }

        Boolean approved = (Boolean) execution.getVariable("approved");
        Long approverId = getLongVariable(execution, "approverId");

        if (Boolean.TRUE.equals(approved)) {
            approveChange(crId, approverId);
        } else {
            handleRejection(crId, approverId, (String) execution.getVariable("approvalComment"));
        }
    }

    private void approveChange(Long crId, Long approverId) {
        ChangeRequest cr = changeRequestMapper.selectById(crId);
        if (cr == null) {
            log.error("ChangeRequest not found: id={}", crId);
            return;
        }

        // Pass crId (not cr.getObjectId()) so BomChangeApprovalCallback can look up the CR
        // and apply the changeData. The callback is responsible for updating CR status.
        try {
            callbackRegistry.onApproved(cr.getObjectType(), crId, approverId);
        } catch (Exception e) {
            log.error("Failed to apply change data for CR {}: {}", crId, e.getMessage(), e);
            cr.setStatus(3); // rejected on failure
            cr.setResolvedAt(LocalDateTime.now());
            changeRequestMapper.updateById(cr);
        }

        log.info("ChangeRequest {} approved and applied by user {}", crId, approverId);
    }

    private void handleRejection(Long crId, Long approverId, String reason) {
        ChangeRequest cr = changeRequestMapper.selectById(crId);
        if (cr == null) {
            log.error("ChangeRequest not found: id={}", crId);
            return;
        }

        cr.setStatus(3); // rejected
        cr.setResolvedBy(approverId);
        cr.setResolvedAt(LocalDateTime.now());
        changeRequestMapper.updateById(cr);

        log.info("ChangeRequest {} rejected by user {}. Reason: {}", crId, approverId, reason);
    }

    private Long getLongVariable(DelegateExecution execution, String name) {
        Object val = execution.getVariable(name);
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).longValue();
        try {
            return Long.parseLong(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
