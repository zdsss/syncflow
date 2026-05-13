package com.syncflow.file.service;

import com.syncflow.file.entity.FileEntity;
import com.syncflow.file.mapper.FileMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flowable.engine.delegate.DelegateExecution;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * BPMN callback service for File approval workflow.
 * <p>
 * Referenced by BPMN service tasks via {@code flowable:delegateExpression="${fileApprovalService}"}.
 */
@Service("fileApprovalService")
@Slf4j
@RequiredArgsConstructor
public class FileApprovalService {

    private final FileMapper fileMapper;

    /**
     * Called by BPMN service task when a file is approved.
     * Publishes the file: sets status to 2 (PUBLISHED).
     *
     * @param execution the Flowable delegate execution context
     */
    @Transactional
    public void publishFile(DelegateExecution execution) {
        Long fileId = (Long) execution.getVariable("businessObjectId");

        FileEntity file = fileMapper.selectById(fileId);
        if (file == null) {
            log.error("FileEntity not found: id={}", fileId);
            return;
        }

        file.setStatus(2); // PUBLISHED
        file.setPublishedAt(LocalDateTime.now());
        Long approverId = (Long) execution.getVariable("assignee");
        if (approverId != null) {
            file.setPublishedBy(approverId);
        }
        file.setFlowInstanceId(null); // clear workflow reference
        fileMapper.updateById(file);

        log.info("File {} published (status=2)", fileId);
    }

    /**
     * Called by BPMN service task when a file approval is rejected.
     * Reverts the file status back to active/editing.
     *
     * @param execution the Flowable delegate execution context
     */
    @Transactional
    public void handleRejection(DelegateExecution execution) {
        Long fileId = (Long) execution.getVariable("businessObjectId");
        String rejectionReason = (String) execution.getVariable("approvalComment");

        FileEntity file = fileMapper.selectById(fileId);
        if (file == null) {
            log.error("FileEntity not found: id={}", fileId);
            return;
        }

        file.setStatus(1); // ACTIVE / EDITING
        file.setFlowInstanceId(null); // clear workflow reference
        fileMapper.updateById(file);

        log.info("File {} rejected, reverted to ACTIVE. Reason: {}", fileId, rejectionReason);
    }
}
