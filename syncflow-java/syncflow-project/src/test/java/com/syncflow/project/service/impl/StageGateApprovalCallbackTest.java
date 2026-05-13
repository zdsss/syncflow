package com.syncflow.project.service.impl;

import com.syncflow.project.entity.StageGate;
import com.syncflow.project.mapper.StageGateMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StageGateApprovalCallback")
class StageGateApprovalCallbackTest {

    @Mock
    private StageGateMapper stageGateMapper;

    @InjectMocks
    private StageGateApprovalCallback callback;

    private StageGate buildStageGate(Long id, Integer status) {
        StageGate g = new StageGate();
        g.setId(id);
        g.setStatus(status);
        g.setFlowInstanceId("flow-sg-1");
        g.setTaskId("task-sg-1");
        return g;
    }

    @Test
    @DisplayName("supportedObjectTypes returns STAGE_GATE")
    void supportedObjectTypes() {
        assertTrue(callback.supportedObjectTypes().contains("STAGE_GATE"));
        assertEquals(1, callback.supportedObjectTypes().size());
    }

    @Test
    @DisplayName("onApproved: sets status=2, approverId, approvedAt, clears flow fields")
    void onApproved_setsApproved() {
        StageGate g = buildStageGate(1L, 1);
        when(stageGateMapper.selectById(1L)).thenReturn(g);
        when(stageGateMapper.updateById(any(StageGate.class))).thenReturn(1);

        callback.onApproved(1L, 42L);

        assertEquals(2, g.getStatus());
        assertEquals(42L, g.getApproverId());
        assertNotNull(g.getApprovedAt());
        assertNull(g.getFlowInstanceId());
        assertNull(g.getTaskId());
        verify(stageGateMapper).updateById(g);
    }

    @Test
    @DisplayName("onRejected: sets status=3, stores reason, clears flow fields")
    void onRejected_setsRejected() {
        StageGate g = buildStageGate(1L, 1);
        when(stageGateMapper.selectById(1L)).thenReturn(g);
        when(stageGateMapper.updateById(any(StageGate.class))).thenReturn(1);

        callback.onRejected(1L, "Incomplete documentation");

        assertEquals(3, g.getStatus());
        assertEquals("Incomplete documentation", g.getComments());
        assertNull(g.getFlowInstanceId());
        assertNull(g.getTaskId());
    }

    @Test
    @DisplayName("onWithdrawn: reverts to status=1, clears flow fields")
    void onWithdrawn_revertsToPending() {
        StageGate g = buildStageGate(1L, 2);
        when(stageGateMapper.selectById(1L)).thenReturn(g);
        when(stageGateMapper.updateById(any(StageGate.class))).thenReturn(1);

        callback.onWithdrawn(1L);

        assertEquals(1, g.getStatus());
        assertNull(g.getFlowInstanceId());
        assertNull(g.getTaskId());
    }

    @Test
    @DisplayName("onApproved: handles missing stage gate gracefully")
    void onApproved_missing_noException() {
        when(stageGateMapper.selectById(999L)).thenReturn(null);

        assertDoesNotThrow(() -> callback.onApproved(999L, 1L));
        verify(stageGateMapper, never()).updateById(any(StageGate.class));
    }

    @Test
    @DisplayName("onRejected: handles missing stage gate gracefully")
    void onRejected_missing_noException() {
        when(stageGateMapper.selectById(999L)).thenReturn(null);

        assertDoesNotThrow(() -> callback.onRejected(999L, "reason"));
        verify(stageGateMapper, never()).updateById(any(StageGate.class));
    }

    @Test
    @DisplayName("onWithdrawn: handles missing stage gate gracefully")
    void onWithdrawn_missing_noException() {
        when(stageGateMapper.selectById(999L)).thenReturn(null);

        assertDoesNotThrow(() -> callback.onWithdrawn(999L));
        verify(stageGateMapper, never()).updateById(any(StageGate.class));
    }
}
