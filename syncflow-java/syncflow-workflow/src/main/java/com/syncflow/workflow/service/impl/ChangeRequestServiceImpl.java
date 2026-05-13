package com.syncflow.workflow.service.impl;

import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.workflow.entity.ChangeRequest;
import com.syncflow.workflow.mapper.ChangeRequestMapper;
import com.syncflow.workflow.service.ApprovalCallbackRegistry;
import com.syncflow.workflow.service.ChangeRequestService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Implementation of {@link ChangeRequestService}.
 */
@Service
@Slf4j
public class ChangeRequestServiceImpl implements ChangeRequestService {

    private final ChangeRequestMapper changeRequestMapper;
    private final ApprovalCallbackRegistry callbackRegistry;

    public ChangeRequestServiceImpl(ChangeRequestMapper changeRequestMapper,
                                     ApprovalCallbackRegistry callbackRegistry) {
        this.changeRequestMapper = changeRequestMapper;
        this.callbackRegistry = callbackRegistry;
    }

    @Override
    @Transactional
    public Long createRequest(String objectType, Long objectId, String changeType,
                              String changeData, String changeSummary, Long requestedBy) {
        ChangeRequest cr = new ChangeRequest();
        cr.setObjectType(objectType);
        cr.setObjectId(objectId);
        cr.setChangeType(changeType);
        cr.setChangeData(changeData);
        cr.setChangeSummary(changeSummary);
        cr.setStatus(1); // pending
        cr.setRequestedBy(requestedBy);
        cr.setRequestedAt(LocalDateTime.now());
        cr.setTenantId(1L);
        cr.setCreatedAt(LocalDateTime.now());
        cr.setUpdatedAt(LocalDateTime.now());

        changeRequestMapper.insert(cr);
        log.info("ChangeRequest created: type={}, objectId={}, changeType={}, id={}",
                objectType, objectId, changeType, cr.getId());
        return cr.getId();
    }

    @Override
    public ChangeRequest getRequest(Long id) {
        return changeRequestMapper.selectById(id);
    }

    @Override
    public List<ChangeRequest> getRequestsByObject(String objectType, Long objectId) {
        return changeRequestMapper.selectList(
                new LambdaQueryWrapper<ChangeRequest>()
                        .eq(ChangeRequest::getObjectType, objectType)
                        .eq(ChangeRequest::getObjectId, objectId)
                        .orderByDesc(ChangeRequest::getCreatedAt));
    }

    @Override
    @Transactional
    public void applyRequest(Long requestId, Long resolvedBy) {
        ChangeRequest cr = changeRequestMapper.selectById(requestId);
        if (cr == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Change request not found: " + requestId);
        }
        if (cr.getStatus() != 1) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "Change request is not in pending state");
        }

        // Attempt to apply the change data via the registered callback handler
        // (e.g., BomChangeApprovalCallback for BOM_CHANGE type).
        // Pass requestId (the CR PK) as objectId — callbacks use selectById(objectId) to load the CR.
        try {
            callbackRegistry.onApproved(cr.getObjectType(), requestId, resolvedBy);
        } catch (Exception e) {
            log.error("Failed to apply change data for request {}: {}", requestId, e.getMessage(), e);
            // Mark as rejected on failure
            cr.setStatus(3); // rejected
            cr.setResolvedBy(resolvedBy);
            cr.setResolvedAt(LocalDateTime.now());
            cr.setUpdatedAt(LocalDateTime.now());
            changeRequestMapper.updateById(cr);
            throw new BusinessException(ErrorCode.PARAM_ERROR,
                    "Failed to apply change: " + e.getMessage());
        }

        // Ensure CR is marked as applied (callback may have already done this,
        // but we set it here as the authoritative lifecycle owner)
        ChangeRequest updated = changeRequestMapper.selectById(requestId);
        if (updated != null && updated.getStatus() != 2) {
            updated.setStatus(2); // applied
            updated.setResolvedBy(resolvedBy);
            updated.setResolvedAt(LocalDateTime.now());
            updated.setUpdatedAt(LocalDateTime.now());
            changeRequestMapper.updateById(updated);
        }

        log.info("ChangeRequest {} applied by user {}", requestId, resolvedBy);
    }

    @Override
    @Transactional
    public void rejectRequest(Long requestId, Long resolvedBy) {
        ChangeRequest cr = changeRequestMapper.selectById(requestId);
        if (cr == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Change request not found: " + requestId);
        }
        if (cr.getStatus() != 1) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "Change request is not in pending state");
        }

        cr.setStatus(3); // rejected
        cr.setResolvedBy(resolvedBy);
        cr.setResolvedAt(LocalDateTime.now());
        cr.setUpdatedAt(LocalDateTime.now());
        changeRequestMapper.updateById(cr);

        log.info("ChangeRequest {} rejected by user {}", requestId, resolvedBy);
    }
}
