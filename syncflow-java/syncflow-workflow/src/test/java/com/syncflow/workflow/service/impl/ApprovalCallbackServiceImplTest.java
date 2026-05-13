package com.syncflow.workflow.service.impl;

import com.syncflow.workflow.mapper.BusinessObjectMapper;
import com.syncflow.workflow.service.ApprovalCallbackRegistry;
import org.flowable.engine.delegate.DelegateExecution;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ApprovalCallbackServiceImpl")
class ApprovalCallbackServiceImplTest {

    @Mock
    private ApprovalCallbackRegistry callbackRegistry;

    @Mock
    private BusinessObjectMapper businessObjectMapper;

    @Mock
    private DelegateExecution execution;

    private ApprovalCallbackServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ApprovalCallbackServiceImpl(callbackRegistry, businessObjectMapper);
    }

    @Test
    @DisplayName("onApproved reads objectId (not businessObjectId) and approverId")
    void onApproved_usesObjectIdNotBusinessObjectId() {
        when(execution.getVariable("objectType")).thenReturn("TASK");
        when(execution.getVariable("objectId")).thenReturn(42L);
        when(execution.getVariable("approverId")).thenReturn(99L);

        service.onApproved(execution);

        verify(callbackRegistry).onApproved("TASK", 42L, 99L);
    }

    @Test
    @DisplayName("onApproved falls back to applicantId when approverId is absent")
    void onApproved_fallsBackToApplicantId() {
        when(execution.getVariable("objectType")).thenReturn("TASK");
        when(execution.getVariable("objectId")).thenReturn(42L);
        when(execution.getVariable("approverId")).thenReturn(null);
        when(execution.getVariable("applicantId")).thenReturn(7L);

        service.onApproved(execution);

        verify(callbackRegistry).onApproved("TASK", 42L, 7L);
    }

    @Test
    @DisplayName("onApproved uses objectId (not businessObjectId) — callback receives entity id")
    void onApproved_doesNotUseBusinessObjectId() {
        when(execution.getVariable("objectType")).thenReturn("BOM");
        when(execution.getVariable("objectId")).thenReturn(10L);
        when(execution.getVariable("approverId")).thenReturn(1L);

        service.onApproved(execution);

        // Must receive the entity id (10), not the wf_business_object PK
        verify(callbackRegistry).onApproved("BOM", 10L, 1L);
    }

    @Test
    @DisplayName("onApproved skips callback when objectType is missing")
    void onApproved_missingObjectType_skips() {
        when(execution.getVariable("objectType")).thenReturn(null);
        when(execution.getVariable("objectId")).thenReturn(42L);

        service.onApproved(execution);

        verifyNoInteractions(callbackRegistry);
    }

    @Test
    @DisplayName("onApproved skips callback when objectId is missing")
    void onApproved_missingObjectId_skips() {
        when(execution.getVariable("objectType")).thenReturn("TASK");
        when(execution.getVariable("objectId")).thenReturn(null);

        service.onApproved(execution);

        verifyNoInteractions(callbackRegistry);
    }

    @Test
    @DisplayName("onRejected reads objectId and dispatches rejection")
    void onRejected_usesObjectId() {
        when(execution.getVariable("objectType")).thenReturn("TASK");
        when(execution.getVariable("objectId")).thenReturn(55L);
        when(execution.getVariable("approvalComment")).thenReturn("Not ready");

        service.onRejected(execution);

        verify(callbackRegistry).onRejected("TASK", 55L, "Not ready");
    }

    @Test
    @DisplayName("onRejected skips when objectId is missing")
    void onRejected_missingObjectId_skips() {
        when(execution.getVariable("objectType")).thenReturn("TASK");
        when(execution.getVariable("objectId")).thenReturn(null);

        service.onRejected(execution);

        verifyNoInteractions(callbackRegistry);
    }
}
