package com.syncflow.workflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChangeApprovalInterceptor")
class ChangeApprovalInterceptorTest {

    @Mock
    private WorkflowService workflowService;

    @Mock
    private ChangeRequestService changeRequestService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ChangeApprovalInterceptor interceptor;

    private static final java.util.Map<String, Object> SAMPLE_CHANGE_DATA =
            java.util.Map.of("itemId", 1, "action", "add");

    @Test
    @DisplayName("intercept: returns true for published entity, creates request and starts workflow")
    void intercept_publishedEntity_returnsTrue() {
        when(changeRequestService.createRequest(
                eq("BOM_CHANGE"), eq(100L), eq("ADD_ITEM"),
                anyString(), isNull(), eq(1L)))
                .thenReturn(1L);
        when(workflowService.startProcess(
                eq("CHANGE_APPROVAL"), eq(1L), eq("BOM_CHANGE"),
                anyString(), eq(1L), eq(1L), isNull()))
                .thenReturn(10L);

        boolean result = interceptor.intercept(
                "BOM_CHANGE", 100L, 3, 3, // published status = 3
                "ADD_ITEM", SAMPLE_CHANGE_DATA, null, 1L, 1L);

        assertTrue(result);
        verify(changeRequestService).createRequest(anyString(), anyLong(), anyString(),
                anyString(), isNull(), anyLong());
        verify(workflowService).startProcess(
                eq("CHANGE_APPROVAL"), anyLong(), eq("BOM_CHANGE"),
                anyString(), anyLong(), anyLong(), isNull());
    }

    @Test
    @DisplayName("intercept: returns false for non-published entity")
    void intercept_draftEntity_returnsFalse() {
        boolean result = interceptor.intercept(
                "BOM_CHANGE", 100L, 1, 3, // draft status 1 != published 3
                "ADD_ITEM", SAMPLE_CHANGE_DATA, null, 1L, 1L);

        assertFalse(result);
        verifyNoInteractions(changeRequestService, workflowService);
    }

    @Test
    @DisplayName("intercept: returns false when status matches")
    void intercept_editingEntity_returnsFalse() {
        boolean result = interceptor.intercept(
                "BOM_CHANGE", 100L, 1, 3,
                "ADD_ITEM", new Object(), null, 1L, 1L);

        assertFalse(result);
    }
}
