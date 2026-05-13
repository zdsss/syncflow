package com.syncflow.project.service.impl;

import com.syncflow.project.entity.Project;
import com.syncflow.project.mapper.ProjectMapper;
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
@DisplayName("ProjectApprovalCallback")
class ProjectApprovalCallbackTest {

    @Mock
    private ProjectMapper projectMapper;

    @InjectMocks
    private ProjectApprovalCallback callback;

    private Project buildProject(Long id, int status) {
        Project project = new Project();
        project.setId(id);
        project.setStatus(status);
        project.setName("Test Project");
        project.setCode("TEST-001");
        return project;
    }

    @Test
    @DisplayName("supportedObjectTypes: returns PROJECT")
    void supportedObjectTypes_returnsProject() {
        assertEquals(java.util.Set.of("PROJECT"), callback.supportedObjectTypes());
    }

    @Test
    @DisplayName("onApproved: sets status to in_progress (2)")
    void onApproved_setsInProgress() {
        Project project = buildProject(1L, 1); // not_started
        project.setFlowInstanceId("flow-123");
        when(projectMapper.selectById(1L)).thenReturn(project);
        when(projectMapper.updateById(any(Project.class))).thenReturn(1);

        callback.onApproved(1L, 10L);

        assertEquals(2, project.getStatus());
        assertNull(project.getFlowInstanceId());
        verify(projectMapper).updateById(project);
    }

    @Test
    @DisplayName("onApproved: skips when Project not found")
    void onApproved_notFound_skips() {
        when(projectMapper.selectById(999L)).thenReturn(null);

        callback.onApproved(999L, 10L);

        verify(projectMapper, never()).updateById(any(Project.class));
    }

    @Test
    @DisplayName("onRejected: reverts status to not_started (1) so user can resubmit")
    void onRejected_revertsToNotStarted() {
        Project project = buildProject(1L, 1);
        project.setFlowInstanceId("flow-123");
        when(projectMapper.selectById(1L)).thenReturn(project);
        when(projectMapper.updateById(any(Project.class))).thenReturn(1);

        callback.onRejected(1L, "insufficient budget");

        assertEquals(1, project.getStatus());
        assertNull(project.getFlowInstanceId());
        verify(projectMapper).updateById(project);
    }

    @Test
    @DisplayName("onWithdrawn: reverts status to not_started (1) so user can resubmit")
    void onWithdrawn_revertsToNotStarted() {
        Project project = buildProject(1L, 1);
        project.setFlowInstanceId("flow-123");
        when(projectMapper.selectById(1L)).thenReturn(project);
        when(projectMapper.updateById(any(Project.class))).thenReturn(1);

        callback.onWithdrawn(1L);

        assertEquals(1, project.getStatus());
        assertNull(project.getFlowInstanceId());
        verify(projectMapper).updateById(project);
    }
}
