package com.syncflow.config.service.impl;

import com.syncflow.config.entity.ModuleSpec;
import com.syncflow.config.mapper.ModuleSpecMapper;
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
@DisplayName("ModuleSpecApprovalCallback")
class ModuleSpecApprovalCallbackTest {

    @Mock
    private ModuleSpecMapper moduleSpecMapper;

    @InjectMocks
    private ModuleSpecApprovalCallback callback;

    private ModuleSpec buildSpec(Long id, Integer status) {
        ModuleSpec s = new ModuleSpec();
        s.setId(id);
        s.setStatus(status);
        s.setFlowInstanceId("flow-spec-1");
        return s;
    }

    @Test
    @DisplayName("supportedObjectTypes returns MODULE_SPEC")
    void supportedObjectTypes() {
        assertTrue(callback.supportedObjectTypes().contains("MODULE_SPEC"));
        assertEquals(1, callback.supportedObjectTypes().size());
    }

    @Test
    @DisplayName("onApproved: sets status=1, releaseAt, clears flowInstanceId")
    void onApproved_setsPublished() {
        ModuleSpec s = buildSpec(1L, 0);
        when(moduleSpecMapper.selectById(1L)).thenReturn(s);
        when(moduleSpecMapper.updateById(any(ModuleSpec.class))).thenReturn(1);

        callback.onApproved(1L, 42L);

        assertEquals(1, s.getStatus());
        assertNotNull(s.getReleaseAt());
        assertNull(s.getFlowInstanceId());
        verify(moduleSpecMapper).updateById(s);
    }

    @Test
    @DisplayName("onRejected: reverts to status=0 (draft), clears flowInstanceId")
    void onRejected_revertsToDraft() {
        ModuleSpec s = buildSpec(1L, 0);
        when(moduleSpecMapper.selectById(1L)).thenReturn(s);
        when(moduleSpecMapper.updateById(any(ModuleSpec.class))).thenReturn(1);

        callback.onRejected(1L, "Missing parameters");

        assertEquals(0, s.getStatus());
        assertNull(s.getFlowInstanceId());
    }

    @Test
    @DisplayName("onWithdrawn: reverts to status=0 (draft), clears flowInstanceId")
    void onWithdrawn_revertsToDraft() {
        ModuleSpec s = buildSpec(1L, 0);
        when(moduleSpecMapper.selectById(1L)).thenReturn(s);
        when(moduleSpecMapper.updateById(any(ModuleSpec.class))).thenReturn(1);

        callback.onWithdrawn(1L);

        assertEquals(0, s.getStatus());
        assertNull(s.getFlowInstanceId());
    }

    @Test
    @DisplayName("onApproved: handles missing spec gracefully")
    void onApproved_missing_noException() {
        when(moduleSpecMapper.selectById(999L)).thenReturn(null);

        assertDoesNotThrow(() -> callback.onApproved(999L, 1L));
        verify(moduleSpecMapper, never()).updateById(any(ModuleSpec.class));
    }

    @Test
    @DisplayName("onRejected: handles missing spec gracefully")
    void onRejected_missing_noException() {
        when(moduleSpecMapper.selectById(999L)).thenReturn(null);

        assertDoesNotThrow(() -> callback.onRejected(999L, "reason"));
        verify(moduleSpecMapper, never()).updateById(any(ModuleSpec.class));
    }

    @Test
    @DisplayName("onWithdrawn: handles missing spec gracefully")
    void onWithdrawn_missing_noException() {
        when(moduleSpecMapper.selectById(999L)).thenReturn(null);

        assertDoesNotThrow(() -> callback.onWithdrawn(999L));
        verify(moduleSpecMapper, never()).updateById(any(ModuleSpec.class));
    }
}
