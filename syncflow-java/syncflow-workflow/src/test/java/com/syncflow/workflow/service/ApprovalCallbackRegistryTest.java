package com.syncflow.workflow.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ApprovalCallbackRegistry")
class ApprovalCallbackRegistryTest {

    @Mock
    private ApprovalCallbackHandler bomHandler;

    @Mock
    private ApprovalCallbackHandler milestoneHandler;

    private ApprovalCallbackRegistry registry;

    @BeforeEach
    void setUp() {
        lenient().when(bomHandler.supportedObjectTypes()).thenReturn(Set.of("BOM", "BOM_CHANGE"));
        lenient().when(milestoneHandler.supportedObjectTypes()).thenReturn(Set.of("MILESTONE"));

        registry = new ApprovalCallbackRegistry(List.of(bomHandler, milestoneHandler));
        registry.init();

        // Clear interactions from init() so verifyNoInteractions works in tests
        clearInvocations(bomHandler, milestoneHandler);
    }

    @Test
    @DisplayName("onApproved dispatches to correct handler by objectType")
    void onApproved_dispatchesToCorrectHandler() {
        registry.onApproved("BOM", 100L, 1L);
        verify(bomHandler).onApproved(100L, 1L);
        verifyNoInteractions(milestoneHandler);
    }

    @Test
    @DisplayName("onApproved dispatches MILESTONE to milestoneHandler")
    void onApproved_milestone_dispatchesToMilestoneHandler() {
        registry.onApproved("MILESTONE", 200L, 2L);
        verify(milestoneHandler).onApproved(200L, 2L);
        verifyNoInteractions(bomHandler);
    }

    @Test
    @DisplayName("onApproved dispatches BOM_CHANGE to bomHandler")
    void onApproved_bomChange_dispatchesToBomHandler() {
        registry.onApproved("BOM_CHANGE", 300L, 3L);
        verify(bomHandler).onApproved(300L, 3L);
    }

    @Test
    @DisplayName("onApproved logs warning for unknown objectType (no exception)")
    void onApproved_unknownType_noException() {
        registry.onApproved("UNKNOWN", 1L, 1L);
        verifyNoInteractions(bomHandler, milestoneHandler);
    }

    @Test
    @DisplayName("onRejected dispatches to correct handler")
    void onRejected_dispatchesToCorrectHandler() {
        registry.onRejected("BOM", 100L, "Not good enough");
        verify(bomHandler).onRejected(100L, "Not good enough");
    }

    @Test
    @DisplayName("onWithdrawn dispatches to correct handler")
    void onWithdrawn_dispatchesToCorrectHandler() {
        registry.onWithdrawn("MILESTONE", 200L);
        verify(milestoneHandler).onWithdrawn(200L);
    }
}
