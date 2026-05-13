package com.syncflow.workflow.service;

import com.syncflow.common.util.SecurityUtils;
import com.syncflow.workflow.entity.ApprovalConfigAudit;
import com.syncflow.workflow.mapper.ApprovalConfigAuditMapper;
import com.syncflow.workflow.mapper.CrossModuleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Records audit trail entries for approval configuration changes.
 */
@Service
@RequiredArgsConstructor
public class ApprovalConfigAuditService {

    private final ApprovalConfigAuditMapper auditMapper;
    private final CrossModuleMapper crossModuleMapper;

    public void record(Long configId, String action, String fieldName,
                       String oldValue, String newValue) {
        Long operatorId = SecurityUtils.tryGetUserId();
        String operatorName = operatorId != null
                ? crossModuleMapper.selectUserRealName(operatorId)
                : "system";

        ApprovalConfigAudit audit = new ApprovalConfigAudit();
        audit.setConfigId(configId);
        audit.setAction(action);
        audit.setFieldName(fieldName);
        audit.setOldValue(oldValue);
        audit.setNewValue(newValue);
        audit.setOperatorId(operatorId);
        audit.setOperatorName(operatorName);
        audit.setCreatedAt(LocalDateTime.now());

        auditMapper.insert(audit);
    }
}
