package com.syncflow.workflow.service.impl;

import com.syncflow.workflow.entity.BusinessObject;
import com.syncflow.workflow.mapper.BusinessObjectMapper;
import com.syncflow.workflow.service.ApprovalCallbackRegistry;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.flowable.engine.HistoryService;
import org.flowable.variable.api.history.HistoricVariableInstance;
import org.flowable.variable.api.history.HistoricVariableInstanceQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ApprovalCompletionHandler")
class ApprovalCompletionHandlerTest {

    @Mock
    private BusinessObjectMapper businessObjectMapper;

    @Mock
    private ApprovalCallbackRegistry callbackRegistry;

    @Mock
    private HistoryService historyService;

    @Mock
    private HistoricVariableInstanceQuery approvedQuery;

    @Mock
    private HistoricVariableInstanceQuery approverQuery;

    @Mock
    private HistoricVariableInstance approvedVar;

    @Mock
    private HistoricVariableInstance approverVar;

    private ApprovalCompletionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new ApprovalCompletionHandler(businessObjectMapper, callbackRegistry, historyService);
    }

    private BusinessObject createPendingBo() {
        BusinessObject bo = new BusinessObject();
        bo.setId(1L);
        bo.setObjectType("TASK");
        bo.setObjectId(100L);
        bo.setObjectName("Test Task");
        bo.setFlowInstanceId("proc-123");
        bo.setStatus(2); // pending
        bo.setApplicantId(10L);
        return bo;
    }

    private void mockHistoryApproved(boolean approved) {
        when(historyService.createHistoricVariableInstanceQuery()).thenReturn(approvedQuery, approverQuery);
        when(approvedQuery.processInstanceId("proc-123")).thenReturn(approvedQuery);
        when(approvedQuery.variableName("approved")).thenReturn(approvedQuery);
        when(approvedQuery.singleResult()).thenReturn(approvedVar);
        when(approvedVar.getValue()).thenReturn(approved);

        when(approverQuery.processInstanceId("proc-123")).thenReturn(approverQuery);
        when(approverQuery.variableName("approverId")).thenReturn(approverQuery);
        when(approverQuery.singleResult()).thenReturn(approverVar);
        when(approverVar.getValue()).thenReturn(99L);
    }

    @Test
    @DisplayName("approved process triggers onApproved callback and updates status to 3")
    void handleProcessCompleted_approved_updatesStatusAndCallsCallback() {
        BusinessObject bo = createPendingBo();
        mockHistoryApproved(true);
        when(businessObjectMapper.update(any(BusinessObject.class), any())).thenReturn(1);

        handler.handleProcessCompleted(bo);

        // Verify the conditional update was called with status=3
        ArgumentCaptor<BusinessObject> entityCaptor = ArgumentCaptor.forClass(BusinessObject.class);
        verify(businessObjectMapper).update(entityCaptor.capture(), any());
        BusinessObject updated = entityCaptor.getValue();
        assertThat(updated.getStatus()).isEqualTo(3);
        assertThat(updated.getCurrentTaskId()).isNull();
        assertThat(updated.getCurrentNode()).isNull();
        assertThat(updated.getCompletedAt()).isNotNull();
        assertThat(updated.getCompletedBy()).isEqualTo(99L);

        // Verify callback dispatched
        verify(callbackRegistry).onApproved("TASK", 100L, 99L);
        verify(callbackRegistry, never()).onRejected(any(), any(), any());
    }

    @Test
    @DisplayName("rejected process triggers onRejected callback and updates status to 4")
    void handleProcessCompleted_rejected_updatesStatusAndCallsCallback() {
        BusinessObject bo = createPendingBo();
        mockHistoryApproved(false);
        when(businessObjectMapper.update(any(BusinessObject.class), any())).thenReturn(1);

        handler.handleProcessCompleted(bo);

        ArgumentCaptor<BusinessObject> entityCaptor = ArgumentCaptor.forClass(BusinessObject.class);
        verify(businessObjectMapper).update(entityCaptor.capture(), any());
        BusinessObject updated = entityCaptor.getValue();
        assertThat(updated.getStatus()).isEqualTo(4);

        verify(callbackRegistry).onRejected("TASK", 100L, null);
        verify(callbackRegistry, never()).onApproved(any(), any(), any());
    }

    @Test
    @DisplayName("skips processing when status is already 3 (approved)")
    void handleProcessCompleted_alreadyApproved_skips() {
        BusinessObject bo = createPendingBo();
        bo.setStatus(3);

        handler.handleProcessCompleted(bo);

        verify(businessObjectMapper, never()).update(any(BusinessObject.class), any());
        verifyNoInteractions(callbackRegistry);
    }

    @Test
    @DisplayName("skips processing when status is already 4 (rejected)")
    void handleProcessCompleted_alreadyRejected_skips() {
        BusinessObject bo = createPendingBo();
        bo.setStatus(4);

        handler.handleProcessCompleted(bo);

        verify(businessObjectMapper, never()).update(any(BusinessObject.class), any());
        verifyNoInteractions(callbackRegistry);
    }

    @Test
    @DisplayName("skips callback when concurrent update wins (affected=0)")
    void handleProcessCompleted_concurrentUpdate_skipsCallback() {
        BusinessObject bo = createPendingBo();
        mockHistoryApproved(true);
        when(businessObjectMapper.update(any(BusinessObject.class), any())).thenReturn(0);

        handler.handleProcessCompleted(bo);

        verify(businessObjectMapper).update(any(BusinessObject.class), any());
        verifyNoInteractions(callbackRegistry);
    }

    @Test
    @DisplayName("defaults to rejected when 'approved' variable is missing from history")
    void handleProcessCompleted_noApprovedVar_defaultsToRejected() {
        BusinessObject bo = createPendingBo();

        // First query returns null (no "approved" variable)
        when(historyService.createHistoricVariableInstanceQuery()).thenReturn(approvedQuery, approverQuery);
        when(approvedQuery.processInstanceId("proc-123")).thenReturn(approvedQuery);
        when(approvedQuery.variableName("approved")).thenReturn(approvedQuery);
        when(approvedQuery.singleResult()).thenReturn(null);

        when(approverQuery.processInstanceId("proc-123")).thenReturn(approverQuery);
        when(approverQuery.variableName("approverId")).thenReturn(approverQuery);
        when(approverQuery.singleResult()).thenReturn(null);

        when(businessObjectMapper.update(any(BusinessObject.class), any())).thenReturn(1);

        handler.handleProcessCompleted(bo);

        ArgumentCaptor<BusinessObject> entityCaptor = ArgumentCaptor.forClass(BusinessObject.class);
        verify(businessObjectMapper).update(entityCaptor.capture(), any());
        assertThat(entityCaptor.getValue().getStatus()).isEqualTo(4); // rejected
        assertThat(entityCaptor.getValue().getCompletedBy()).isNull();

        verify(callbackRegistry).onRejected("TASK", 100L, null);
    }

    @Test
    @DisplayName("handles history service exception gracefully (fail-closed to rejected)")
    void handleProcessCompleted_historyException_defaultsToRejected() {
        BusinessObject bo = createPendingBo();

        when(historyService.createHistoricVariableInstanceQuery()).thenThrow(new RuntimeException("DB error"));
        when(businessObjectMapper.update(any(BusinessObject.class), any())).thenReturn(1);

        handler.handleProcessCompleted(bo);

        ArgumentCaptor<BusinessObject> entityCaptor = ArgumentCaptor.forClass(BusinessObject.class);
        verify(businessObjectMapper).update(entityCaptor.capture(), any());
        assertThat(entityCaptor.getValue().getStatus()).isEqualTo(4); // fail-closed
    }
}
