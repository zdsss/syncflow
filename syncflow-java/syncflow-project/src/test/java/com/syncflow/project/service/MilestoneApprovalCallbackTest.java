package com.syncflow.project.service.impl;

import com.syncflow.project.entity.Milestone;
import com.syncflow.project.mapper.MilestoneMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MilestoneApprovalCallback")
class MilestoneApprovalCallbackTest {

    @Mock
    private MilestoneMapper milestoneMapper;

    @InjectMocks
    private MilestoneApprovalCallback callback;

    private Milestone buildMilestone(Long id, Integer status) {
        Milestone m = new Milestone();
        m.setId(id);
        m.setStatus(status);
        m.setFlowInstanceId("flow-123");
        return m;
    }

    @Test
    @DisplayName("supportedObjectTypes returns MILESTONE")
    void supportedObjectTypes() {
        assertTrue(callback.supportedObjectTypes().contains("MILESTONE"));
    }

    @Test
    @DisplayName("onApproved: sets status=3, actualDate=today, progress=100")
    void onApproved_setsCompleted() {
        Milestone m = buildMilestone(1L, 2);
        when(milestoneMapper.selectById(1L)).thenReturn(m);
        when(milestoneMapper.updateById(any(Milestone.class))).thenReturn(1);

        callback.onApproved(1L, 1L);

        assertEquals(3, m.getStatus());
        assertEquals(LocalDate.now(), m.getActualDate());
        assertEquals(100, m.getProgress());
        assertNull(m.getFlowInstanceId());
        verify(milestoneMapper).updateById(m);
    }

    @Test
    @DisplayName("onRejected: reverts to status=2, clears flowInstanceId")
    void onRejected_revertsToInProgress() {
        Milestone m = buildMilestone(1L, 2);
        when(milestoneMapper.selectById(1L)).thenReturn(m);
        when(milestoneMapper.updateById(any(Milestone.class))).thenReturn(1);

        callback.onRejected(1L, "Missing documentation");

        assertEquals(2, m.getStatus());
        assertNull(m.getFlowInstanceId());
    }

    @Test
    @DisplayName("onWithdrawn: reverts to status=2, clears flowInstanceId")
    void onWithdrawn_revertsToInProgress() {
        Milestone m = buildMilestone(1L, 2);
        when(milestoneMapper.selectById(1L)).thenReturn(m);
        when(milestoneMapper.updateById(any(Milestone.class))).thenReturn(1);

        callback.onWithdrawn(1L);

        assertEquals(2, m.getStatus());
        assertNull(m.getFlowInstanceId());
    }

    @Test
    @DisplayName("onApproved: handles missing milestone gracefully")
    void onApproved_missingMilestone_noException() {
        when(milestoneMapper.selectById(999L)).thenReturn(null);

        assertDoesNotThrow(() -> callback.onApproved(999L, 1L));
        verify(milestoneMapper, never()).updateById(any(Milestone.class));
    }
}
