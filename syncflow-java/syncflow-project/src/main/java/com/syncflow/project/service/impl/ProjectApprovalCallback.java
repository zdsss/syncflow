package com.syncflow.project.service.impl;

import com.syncflow.project.entity.Project;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.workflow.service.ApprovalCallbackHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * Handles approval lifecycle for PROJECT objects.
 * On approval, sets project status to in_progress (2).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ProjectApprovalCallback implements ApprovalCallbackHandler {

    private final ProjectMapper projectMapper;

    @Override
    public Set<String> supportedObjectTypes() {
        return Set.of("PROJECT");
    }

    @Override
    @Transactional
    public void onApproved(Long projectId, Long approverId) {
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            log.warn("Project {} not found, skipping approval callback", projectId);
            return;
        }
        project.setStatus(2); // in_progress
        project.setFlowInstanceId(null);
        projectMapper.updateById(project);
        log.info("Project {} approved, status set to in_progress", projectId);
    }

    @Override
    @Transactional
    public void onRejected(Long projectId, String reason) {
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            log.warn("Project {} not found, skipping rejection callback", projectId);
            return;
        }
        project.setStatus(1); // revert to not_started so user can resubmit
        project.setFlowInstanceId(null);
        projectMapper.updateById(project);
        log.info("Project {} rejected, status reverted to not_started: {}", projectId, reason);
    }

    @Override
    @Transactional
    public void onWithdrawn(Long projectId) {
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            log.warn("Project {} not found, skipping withdrawal callback", projectId);
            return;
        }
        project.setStatus(1); // revert to not_started so user can resubmit
        project.setFlowInstanceId(null);
        projectMapper.updateById(project);
        log.info("Project {} withdrawn, status reverted to not_started", projectId);
    }
}
