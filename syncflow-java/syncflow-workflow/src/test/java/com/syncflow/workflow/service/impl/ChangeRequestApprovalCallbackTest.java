package com.syncflow.workflow.service.impl;

import com.syncflow.workflow.entity.ChangeRequest;
import com.syncflow.workflow.mapper.ChangeRequestMapper;
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
@DisplayName("ChangeRequestApprovalCallback")
class ChangeRequestApprovalCallbackTest {

    @Mock
    private ChangeRequestMapper changeRequestMapper;

    @InjectMocks
    private ChangeRequestApprovalCallback callback;

    private ChangeRequest buildChangeRequest(Long id, Integer status) {
        ChangeRequest cr = new ChangeRequest();
        cr.setId(id);
        cr.setStatus(status);
        cr.setFlowInstanceId("flow-cr-1");
        return cr;
    }

    @Test
    @DisplayName("supportedObjectTypes returns CHANGE")
    void supportedObjectTypes() {
        assertTrue(callback.supportedObjectTypes().contains("CHANGE"));
        assertEquals(1, callback.supportedObjectTypes().size());
    }

    @Test
    @DisplayName("onApproved: sets status=2, resolvedBy, resolvedAt")
    void onApproved_setsApplied() {
        ChangeRequest cr = buildChangeRequest(1L, 1);
        when(changeRequestMapper.selectById(1L)).thenReturn(cr);
        when(changeRequestMapper.updateById(any(ChangeRequest.class))).thenReturn(1);

        callback.onApproved(1L, 42L);

        assertEquals(2, cr.getStatus());
        assertEquals(42L, cr.getResolvedBy());
        assertNotNull(cr.getResolvedAt());
        verify(changeRequestMapper).updateById(cr);
    }

    @Test
    @DisplayName("onRejected: sets status=3, resolvedAt")
    void onRejected_setsRejected() {
        ChangeRequest cr = buildChangeRequest(1L, 1);
        when(changeRequestMapper.selectById(1L)).thenReturn(cr);
        when(changeRequestMapper.updateById(any(ChangeRequest.class))).thenReturn(1);

        callback.onRejected(1L, "Not justified");

        assertEquals(3, cr.getStatus());
        assertNotNull(cr.getResolvedAt());
    }

    @Test
    @DisplayName("onWithdrawn: sets status=3, resolvedAt")
    void onWithdrawn_setsRejected() {
        ChangeRequest cr = buildChangeRequest(1L, 1);
        when(changeRequestMapper.selectById(1L)).thenReturn(cr);
        when(changeRequestMapper.updateById(any(ChangeRequest.class))).thenReturn(1);

        callback.onWithdrawn(1L);

        assertEquals(3, cr.getStatus());
        assertNotNull(cr.getResolvedAt());
    }

    @Test
    @DisplayName("onApproved: handles missing change request gracefully")
    void onApproved_missing_noException() {
        when(changeRequestMapper.selectById(999L)).thenReturn(null);

        assertDoesNotThrow(() -> callback.onApproved(999L, 1L));
        verify(changeRequestMapper, never()).updateById(any(ChangeRequest.class));
    }

    @Test
    @DisplayName("onRejected: handles missing change request gracefully")
    void onRejected_missing_noException() {
        when(changeRequestMapper.selectById(999L)).thenReturn(null);

        assertDoesNotThrow(() -> callback.onRejected(999L, "reason"));
        verify(changeRequestMapper, never()).updateById(any(ChangeRequest.class));
    }

    @Test
    @DisplayName("onWithdrawn: handles missing change request gracefully")
    void onWithdrawn_missing_noException() {
        when(changeRequestMapper.selectById(999L)).thenReturn(null);

        assertDoesNotThrow(() -> callback.onWithdrawn(999L));
        verify(changeRequestMapper, never()).updateById(any(ChangeRequest.class));
    }
}
