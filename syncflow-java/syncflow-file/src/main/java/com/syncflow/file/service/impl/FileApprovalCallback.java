package com.syncflow.file.service.impl;

import com.syncflow.file.entity.FileEntity;
import com.syncflow.file.mapper.FileMapper;
import com.syncflow.workflow.service.ApprovalCallbackHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Approval callback for file publish approval.
 * <p>
 * On approval marks the file as published (publishedAt, publishedBy) and
 * clears the workflow reference.
 * On rejection/withdrawal clears the workflow reference (file stays in
 * its pre-submission state).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FileApprovalCallback implements ApprovalCallbackHandler {

    private final FileMapper fileMapper;

    @Override
    public Set<String> supportedObjectTypes() {
        return Set.of("FILE", "FILE_BOM", "FILE_PROCESS", "FILE_DOCUMENT");
    }

    @Override
    @Transactional
    public void onApproved(Long objectId, Long approverId) {
        FileEntity file = fileMapper.selectById(objectId);
        if (file == null) {
            log.warn("File {} not found, skipping approval callback", objectId);
            return;
        }
        file.setStatus(1);
        file.setPublishedAt(LocalDateTime.now());
        file.setPublishedBy(approverId);
        file.setFlowInstanceId(null);
        fileMapper.updateById(file);
        log.info("File {} published by user {}", objectId, approverId);
    }

    @Override
    @Transactional
    public void onRejected(Long objectId, String reason) {
        FileEntity file = fileMapper.selectById(objectId);
        if (file == null) {
            log.warn("File {} not found, skipping rejection callback", objectId);
            return;
        }
        file.setFlowInstanceId(null);
        fileMapper.updateById(file);
        log.info("File {} approval rejected: {}", objectId, reason);
    }

    @Override
    @Transactional
    public void onWithdrawn(Long objectId) {
        FileEntity file = fileMapper.selectById(objectId);
        if (file == null) {
            log.warn("File {} not found, skipping withdrawal callback", objectId);
            return;
        }
        file.setFlowInstanceId(null);
        fileMapper.updateById(file);
        log.info("File {} approval withdrawn", objectId);
    }
}
