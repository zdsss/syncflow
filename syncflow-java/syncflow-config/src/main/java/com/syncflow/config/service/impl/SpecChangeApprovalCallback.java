package com.syncflow.config.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.config.entity.SpecParam;
import com.syncflow.config.mapper.SpecParamMapper;
import com.syncflow.workflow.entity.ChangeRequest;
import com.syncflow.workflow.mapper.ChangeRequestMapper;
import com.syncflow.workflow.service.ApprovalCallbackHandler;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;

/**
 * Handles approval lifecycle for SPEC_CHANGE objects.
 * On approval, applies the pending spec parameter change.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SpecChangeApprovalCallback implements ApprovalCallbackHandler {

    private final ChangeRequestMapper changeRequestMapper;
    private final SpecParamMapper specParamMapper;
    private final ObjectMapper objectMapper;

    @Override
    public Set<String> supportedObjectTypes() {
        return Set.of("SPEC_CHANGE");
    }

    @Override
    @Transactional
    public void onApproved(Long objectId, Long approverId) {
        ChangeRequest cr = changeRequestMapper.selectOne(
                new LambdaQueryWrapper<ChangeRequest>()
                        .eq(ChangeRequest::getObjectId, objectId)
                        .eq(ChangeRequest::getObjectType, "SPEC_CHANGE")
                        .orderByDesc(ChangeRequest::getId)
                        .last("LIMIT 1"));
        if (cr == null) {
            log.warn("SPEC_CHANGE request for objectId={} not found, skipping callback", objectId);
            return;
        }

        try {
            applyChange(cr);
            cr.setStatus(2); // applied
            cr.setResolvedBy(approverId);
            cr.setResolvedAt(java.time.LocalDateTime.now());
            changeRequestMapper.updateById(cr);
            log.info("SPEC_CHANGE for objectId={} applied successfully", objectId);
        } catch (Exception e) {
            log.error("Failed to apply SPEC_CHANGE for objectId={}", objectId, e);
            throw new RuntimeException("Failed to apply approved spec change", e);
        }
    }

    @Override
    public void onRejected(Long objectId, String reason) {
        ChangeRequest cr = changeRequestMapper.selectOne(
                new LambdaQueryWrapper<ChangeRequest>()
                        .eq(ChangeRequest::getObjectId, objectId)
                        .eq(ChangeRequest::getObjectType, "SPEC_CHANGE")
                        .orderByDesc(ChangeRequest::getId)
                        .last("LIMIT 1"));
        if (cr == null) return;
        cr.setStatus(3); // rejected
        cr.setResolvedAt(java.time.LocalDateTime.now());
        changeRequestMapper.updateById(cr);
        log.info("SPEC_CHANGE for objectId={} rejected: {}", objectId, reason);
    }

    @Override
    public void onWithdrawn(Long objectId) {
        ChangeRequest cr = changeRequestMapper.selectOne(
                new LambdaQueryWrapper<ChangeRequest>()
                        .eq(ChangeRequest::getObjectId, objectId)
                        .eq(ChangeRequest::getObjectType, "SPEC_CHANGE")
                        .orderByDesc(ChangeRequest::getId)
                        .last("LIMIT 1"));
        if (cr == null) return;
        cr.setStatus(3);
        cr.setResolvedAt(java.time.LocalDateTime.now());
        changeRequestMapper.updateById(cr);
        log.info("SPEC_CHANGE for objectId={} withdrawn", objectId);
    }

    @SuppressWarnings("unchecked")
    private void applyChange(ChangeRequest cr) throws Exception {
        String changeType = cr.getChangeType();
        Map<String, Object> data = objectMapper.readValue(cr.getChangeData(), Map.class);

        switch (changeType) {
            case "ADD_PARAM" -> applyAddParam(cr.getObjectId(), data);
            case "UPDATE_PARAM" -> applyUpdateParam(data);
            case "DELETE_PARAM" -> applyDeleteParam(data);
            default -> log.warn("Unknown spec change type: {}", changeType);
        }
    }

    private void applyAddParam(Long specId, Map<String, Object> data) {
        SpecParam param = new SpecParam();
        param.setSpecId(specId);
        param.setParamName(getString(data, "paramName"));
        param.setParamType(getString(data, "paramType"));
        param.setControlType(getString(data, "controlType"));
        param.setDefaultValue(getString(data, "defaultValue"));
        param.setOptions(getString(data, "options"));
        param.setUnit(getString(data, "unit"));
        param.setSortOrder(0);
        if (data.containsKey("isRequired")) {
            Object v = data.get("isRequired");
            param.setIsRequired(Boolean.parseBoolean(v.toString()));
        }
        specParamMapper.insert(param);
    }

    private void applyUpdateParam(Map<String, Object> data) {
        Long paramId = getLong(data, "paramId");
        if (paramId == null) return;

        SpecParam param = specParamMapper.selectById(paramId);
        if (param == null) {
            log.warn("SpecParam {} not found for update", paramId);
            return;
        }

        if (data.containsKey("paramName")) param.setParamName(getString(data, "paramName"));
        if (data.containsKey("defaultValue")) param.setDefaultValue(getString(data, "defaultValue"));
        if (data.containsKey("unit")) param.setUnit(getString(data, "unit"));

        specParamMapper.updateById(param);
    }

    private void applyDeleteParam(Map<String, Object> data) {
        Long paramId = getLong(data, "paramId");
        if (paramId == null) return;
        specParamMapper.deleteById(paramId);
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
