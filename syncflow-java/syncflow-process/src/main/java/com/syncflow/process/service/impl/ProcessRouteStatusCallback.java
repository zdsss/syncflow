package com.syncflow.process.service.impl;

import com.syncflow.process.entity.ProcessRoute;
import com.syncflow.process.mapper.ProcessRouteMapper;
import com.syncflow.workflow.service.ApprovalCallbackHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * Handles approval lifecycle for PROCESS_ROUTE objects (route-level approval).
 * Distinct from ProcessRouteApprovalCallback which handles PROCESS_CHANGE (operation-level changes).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ProcessRouteStatusCallback implements ApprovalCallbackHandler {

    private final ProcessRouteMapper processRouteMapper;

    @Override
    public Set<String> supportedObjectTypes() {
        return Set.of("PROCESS_ROUTE");
    }

    @Override
    @Transactional
    public void onApproved(Long objectId, Long approverId) {
        ProcessRoute route = processRouteMapper.selectById(objectId);
        if (route == null) {
            log.error("ProcessRoute not found for approval callback: id={}", objectId);
            return;
        }
        if (route.getStatus() == 5) {
            log.info("ProcessRoute {} already published, skipping duplicate callback", objectId);
            return;
        }
        route.setStatus(5); // PUBLISHED
        route.setFlowInstanceId(null);
        processRouteMapper.updateById(route);
        log.info("ProcessRoute {} published via event listener callback", objectId);
    }

    @Override
    @Transactional
    public void onRejected(Long objectId, String reason) {
        ProcessRoute route = processRouteMapper.selectById(objectId);
        if (route == null) {
            log.error("ProcessRoute not found for rejection callback: id={}", objectId);
            return;
        }
        route.setStatus(1); // DRAFT
        route.setFlowInstanceId(null);
        processRouteMapper.updateById(route);
        log.info("ProcessRoute {} rejected, reverted to DRAFT. Reason: {}", objectId, reason);
    }

    @Override
    @Transactional
    public void onWithdrawn(Long objectId) {
        ProcessRoute route = processRouteMapper.selectById(objectId);
        if (route == null) return;
        route.setStatus(1); // DRAFT
        route.setFlowInstanceId(null);
        processRouteMapper.updateById(route);
        log.info("ProcessRoute {} withdrawn, reverted to DRAFT", objectId);
    }
}
