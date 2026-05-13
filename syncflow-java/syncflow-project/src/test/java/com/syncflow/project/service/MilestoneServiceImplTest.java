package com.syncflow.project.service.impl;

import com.syncflow.common.exception.BusinessException;
import com.syncflow.project.entity.Milestone;
import com.syncflow.project.mapper.MilestoneMapper;
import com.syncflow.workflow.entity.BusinessObject;
import com.syncflow.workflow.service.WorkflowService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MilestoneServiceImpl")
class MilestoneServiceImplTest {

    @Mock
    private MilestoneMapper milestoneMapper;

    @Mock
    private WorkflowService workflowService;

    @InjectMocks
    private MilestoneServiceImpl milestoneService;

    private Milestone buildMilestone(Long id, Integer status, String deliverable) {
        Milestone m = new Milestone();
        m.setId(id);
        m.setProjectId(1L);
        m.setName("Test Milestone");
        m.setStatus(status);
        m.setDeliverable(deliverable);
        m.setAssigneeId(1L);
        m.setProgress(0);
        return m;
    }

    @Test
    @DisplayName("completeMilestone: in-progress with deliverable starts approval")
    void completeMilestone_withDeliverable_startsApproval() {
        Milestone m = buildMilestone(1L, 2, "Design document review");
        when(milestoneMapper.selectById(1L)).thenReturn(m);

        BusinessObject bo = new BusinessObject();
        bo.setId(100L);
        bo.setFlowInstanceId("flow-123");

        when(workflowService.startProcess(
                eq("GENERIC_APPROVAL"), eq(1L), eq("MILESTONE"),
                eq("Test Milestone"), eq(1L), eq(1L), isNull()))
                .thenReturn(100L);
        when(workflowService.getBusinessObjectEntity(100L)).thenReturn(bo);
        when(milestoneMapper.updateById(any(Milestone.class))).thenReturn(1);

        milestoneService.completeMilestone(1L);

        verify(workflowService).startProcess(
                eq("GENERIC_APPROVAL"), eq(1L), eq("MILESTONE"),
                eq("Test Milestone"), eq(1L), eq(1L), isNull());
        assertEquals("flow-123", m.getFlowInstanceId());
        verify(milestoneMapper).updateById(m);
    }

    @Test
    @DisplayName("completeMilestone: in-progress without deliverable completes directly")
    void completeMilestone_noDeliverable_completesDirectly() {
        Milestone m = buildMilestone(1L, 2, null);
        when(milestoneMapper.selectById(1L)).thenReturn(m);
        when(milestoneMapper.updateById(any(Milestone.class))).thenReturn(1);

        milestoneService.completeMilestone(1L);

        assertEquals(3, m.getStatus());
        assertEquals(LocalDate.now(), m.getActualDate());
        assertEquals(100, m.getProgress());
        verifyNoInteractions(workflowService);
    }

    @Test
    @DisplayName("completeMilestone: in-progress with blank deliverable completes directly")
    void completeMilestone_blankDeliverable_completesDirectly() {
        Milestone m = buildMilestone(1L, 2, "   ");
        when(milestoneMapper.selectById(1L)).thenReturn(m);
        when(milestoneMapper.updateById(any(Milestone.class))).thenReturn(1);

        milestoneService.completeMilestone(1L);

        assertEquals(3, m.getStatus());
        verifyNoInteractions(workflowService);
    }

    @Test
    @DisplayName("completeMilestone: not in-progress throws")
    void completeMilestone_notInProgress_throws() {
        Milestone m = buildMilestone(1L, 3, null); // already completed
        when(milestoneMapper.selectById(1L)).thenReturn(m);

        assertThrows(BusinessException.class, () -> milestoneService.completeMilestone(1L));
        verifyNoInteractions(workflowService);
    }

    @Test
    @DisplayName("completeMilestone: not found throws")
    void completeMilestone_notFound_throws() {
        when(milestoneMapper.selectById(999L)).thenReturn(null);

        assertThrows(BusinessException.class, () -> milestoneService.completeMilestone(999L));
    }
}
