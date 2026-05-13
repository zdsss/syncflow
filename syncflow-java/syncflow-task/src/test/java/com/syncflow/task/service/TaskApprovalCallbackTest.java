package com.syncflow.task.service.impl;

import com.syncflow.project.mapper.MilestoneMapper;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.task.entity.Task;
import com.syncflow.task.enums.TaskStatus;
import com.syncflow.task.mapper.TaskMapper;
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
@DisplayName("TaskApprovalCallback")
class TaskApprovalCallbackTest {

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private ProjectMapper projectMapper;

    @Mock
    private MilestoneMapper milestoneMapper;

    @InjectMocks
    private TaskApprovalCallback callback;

    private Task buildTask(Long id, Integer status) {
        Task t = new Task();
        t.setId(id);
        t.setStatus(status);
        t.setFlowInstanceId("flow-123");
        t.setTaskIdInFlow("task-001");
        return t;
    }

    @Test
    @DisplayName("supportedObjectTypes returns TASK, ISSUE, RISK, MILESTONE")
    void supportedObjectTypes() {
        assertTrue(callback.supportedObjectTypes().containsAll(
                java.util.Set.of("TASK", "ISSUE", "RISK", "MILESTONE")));
    }

    @Test
    @DisplayName("onApproved: sets status=4, progress=100, actualEnd=today")
    void onApproved_setsCompleted() {
        Task task = buildTask(1L, 3); // PENDING_REVIEW
        when(taskMapper.selectById(1L)).thenReturn(task);
        when(taskMapper.updateById(any(Task.class))).thenReturn(1);

        callback.onApproved(1L, 1L);

        assertEquals(TaskStatus.COMPLETED.getCode(), task.getStatus());
        assertEquals(100, task.getProgress());
        assertEquals(LocalDate.now(), task.getActualEnd());
        assertNull(task.getFlowInstanceId());
        assertNull(task.getTaskIdInFlow());
        verify(taskMapper).updateById(task);
    }

    @Test
    @DisplayName("onRejected: reverts to IN_PROGRESS, clears flow fields")
    void onRejected_revertsToInProgress() {
        Task task = buildTask(1L, 3);
        when(taskMapper.selectById(1L)).thenReturn(task);
        when(taskMapper.updateById(any(Task.class))).thenReturn(1);

        callback.onRejected(1L, "Missing test cases");

        assertEquals(TaskStatus.IN_PROGRESS.getCode(), task.getStatus());
        assertNull(task.getFlowInstanceId());
    }

    @Test
    @DisplayName("onWithdrawn: reverts to IN_PROGRESS, clears flow fields")
    void onWithdrawn_revertsToInProgress() {
        Task task = buildTask(1L, 3);
        when(taskMapper.selectById(1L)).thenReturn(task);
        when(taskMapper.updateById(any(Task.class))).thenReturn(1);

        callback.onWithdrawn(1L);

        assertEquals(TaskStatus.IN_PROGRESS.getCode(), task.getStatus());
        assertNull(task.getFlowInstanceId());
    }

    @Test
    @DisplayName("onApproved: handles missing task gracefully")
    void onApproved_missingTask_noException() {
        when(taskMapper.selectById(999L)).thenReturn(null);

        assertDoesNotThrow(() -> callback.onApproved(999L, 1L));
        verify(taskMapper, never()).updateById(any(Task.class));
    }
}
