package com.syncflow.process.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.process.entity.Operation;
import com.syncflow.process.mapper.OperationMapper;
import com.syncflow.workflow.entity.ChangeRequest;
import com.syncflow.workflow.mapper.ChangeRequestMapper;
import com.syncflow.workflow.service.ApprovalCallbackHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Handles approval lifecycle for PROCESS_CHANGE objects.
 * On approval, applies the pending operation change to the process route.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ProcessRouteApprovalCallback implements ApprovalCallbackHandler {

    private final ChangeRequestMapper changeRequestMapper;
    private final OperationMapper operationMapper;
    private final ObjectMapper objectMapper;

    @Override
    public Set<String> supportedObjectTypes() {
        return Set.of("PROCESS_CHANGE");
    }

    @Override
    @Transactional
    public void onApproved(Long objectId, Long approverId) {
        ChangeRequest cr = changeRequestMapper.selectById(objectId);
        if (cr == null) {
            log.warn("PROCESS_CHANGE request id={} not found, skipping callback", objectId);
            return;
        }

        try {
            applyChange(cr);
            cr.setResolvedBy(approverId);
            cr.setResolvedAt(java.time.LocalDateTime.now());
            cr.setStatus(2); // applied
            changeRequestMapper.updateById(cr);
            log.info("PROCESS_CHANGE cr={} applied successfully", objectId);
        } catch (Exception e) {
            log.error("Failed to apply PROCESS_CHANGE cr={}", objectId, e);
            throw new RuntimeException("Failed to apply approved process route change", e);
        }
    }

    @Override
    public void onRejected(Long objectId, String reason) {
        ChangeRequest cr = changeRequestMapper.selectById(objectId);
        if (cr == null) return;
        cr.setStatus(3); // rejected
        cr.setResolvedAt(java.time.LocalDateTime.now());
        changeRequestMapper.updateById(cr);
        log.info("PROCESS_CHANGE cr={} rejected: {}", objectId, reason);
    }

    @Override
    public void onWithdrawn(Long objectId) {
        ChangeRequest cr = changeRequestMapper.selectById(objectId);
        if (cr == null) return;
        cr.setStatus(4); // withdrawn
        cr.setResolvedAt(java.time.LocalDateTime.now());
        changeRequestMapper.updateById(cr);
        log.info("PROCESS_CHANGE cr={} withdrawn", objectId);
    }

    @SuppressWarnings("unchecked")
    private void applyChange(ChangeRequest cr) throws Exception {
        String changeType = cr.getChangeType();
        Map<String, Object> data = objectMapper.readValue(cr.getChangeData(), Map.class);

        switch (changeType) {
            case "ADD_OPERATION" -> applyAddOperation(cr.getObjectId(), data);
            case "UPDATE_OPERATION" -> applyUpdateOperation(data);
            case "DELETE_OPERATION" -> applyDeleteOperation(data);
            default -> log.warn("Unknown process change type: {}", changeType);
        }
    }

    private void applyAddOperation(Long routeId, Map<String, Object> data) {
        Operation op = new Operation();
        op.setRouteId(routeId);
        op.setName(getString(data, "name"));
        op.setDescription(getString(data, "description"));
        op.setMaterialCode(getString(data, "materialCode"));
        op.setMaterialName(getString(data, "materialName"));
        op.setDrawingNo(getString(data, "drawingNo"));
        op.setSourceType(getString(data, "sourceType"));
        op.setWorkCenterCode(getString(data, "workCenterCode"));
        op.setWorkCenterName(getString(data, "workCenterName"));
        op.setStatus(1);

        List<Operation> existing = operationMapper.selectByRouteId(routeId);
        int nextSeq = (existing.size() + 1) * 10;
        op.setSeqNo(nextSeq);
        op.setOperationNo(String.format("%04d", nextSeq));

        operationMapper.insert(op);
    }

    private void applyUpdateOperation(Map<String, Object> data) {
        Long operationId = getLong(data, "operationId");
        if (operationId == null) return;

        Operation op = operationMapper.selectById(operationId);
        if (op == null) {
            log.warn("Operation {} not found for update", operationId);
            return;
        }

        if (data.containsKey("name")) op.setName(getString(data, "name"));
        if (data.containsKey("description")) op.setDescription(getString(data, "description"));
        if (data.containsKey("materialCode")) op.setMaterialCode(getString(data, "materialCode"));
        if (data.containsKey("workCenterCode")) op.setWorkCenterCode(getString(data, "workCenterCode"));

        operationMapper.updateById(op);
    }

    private void applyDeleteOperation(Map<String, Object> data) {
        Long operationId = getLong(data, "operationId");
        if (operationId == null) return;
        operationMapper.deleteById(operationId);
    }

    private String getString(Map<String, Object> data, String key) {
        Object v = data.get(key);
        return v != null ? v.toString() : null;
    }

    private Long getLong(Map<String, Object> data, String key) {
        Object v = data.get(key);
        if (v == null) return null;
        return v instanceof Number ? ((Number) v).longValue() : Long.parseLong(v.toString());
    }
}
