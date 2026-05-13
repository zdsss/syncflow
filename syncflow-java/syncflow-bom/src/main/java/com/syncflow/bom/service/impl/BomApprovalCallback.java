package com.syncflow.bom.service.impl;

import com.syncflow.bom.entity.Bom;
import com.syncflow.bom.enums.BomStatus;
import com.syncflow.bom.mapper.BomMapper;
import com.syncflow.workflow.service.ApprovalCallbackHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Handles approval lifecycle for BOM first-publish (objectType=BOM).
 * On approval, sets BOM status to PUBLISHED.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class BomApprovalCallback implements ApprovalCallbackHandler {

    private final BomMapper bomMapper;

    @Override
    public Set<String> supportedObjectTypes() {
        return Set.of("BOM");
    }

    @Override
    @Transactional
    public void onApproved(Long bomId, Long approverId) {
        Bom bom = bomMapper.selectById(bomId);
        if (bom == null) {
            log.warn("BOM {} not found, skipping approval callback", bomId);
            return;
        }
        bom.setStatus(BomStatus.PUBLISHED.getCode());
        bom.setApprovedBy(approverId);
        bom.setApprovedAt(LocalDateTime.now());
        bomMapper.updateById(bom);
        log.info("BOM {} published by user {}", bomId, approverId);
    }

    @Override
    public void onRejected(Long bomId, String reason) {
        Bom bom = bomMapper.selectById(bomId);
        if (bom == null) return;
        bom.setStatus(BomStatus.EDITING.getCode());
        bomMapper.updateById(bom);
        log.info("BOM {} approval rejected, reverted to editing: {}", bomId, reason);
    }

    @Override
    public void onWithdrawn(Long bomId) {
        Bom bom = bomMapper.selectById(bomId);
        if (bom == null) return;
        bom.setStatus(BomStatus.EDITING.getCode());
        bomMapper.updateById(bom);
        log.info("BOM {} approval withdrawn, reverted to editing", bomId);
    }
}
