package com.syncflow.process.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.process.entity.Operation;
import com.syncflow.process.mapper.OperationMapper;
import com.syncflow.workflow.entity.ChangeRequest;
import com.syncflow.workflow.mapper.ChangeRequestMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProcessRouteApprovalCallback")
class ProcessRouteApprovalCallbackTest {

    @Mock
    private ChangeRequestMapper changeRequestMapper;

    @Mock
    private OperationMapper operationMapper;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ProcessRouteApprovalCallback callback;

    private ChangeRequest buildCr(Long id, String changeType, String changeData, int status) {
        ChangeRequest cr = new ChangeRequest();
        cr.setId(id);
        cr.setObjectType("PROCESS_CHANGE");
        cr.setObjectId(200L);
        cr.setChangeType(changeType);
        cr.setChangeData(changeData);
        cr.setStatus(status);
        return cr;
    }

    @Test
    @DisplayName("supportedObjectTypes: returns PROCESS_CHANGE")
    void supportedObjectTypes_returnsProcessChange() {
        assertEquals(java.util.Set.of("PROCESS_CHANGE"), callback.supportedObjectTypes());
    }

    @Test
    @DisplayName("onApproved: applies ADD_OPERATION change")
    void onApproved_addOperation_insertsOperation() throws Exception {
        String data = objectMapper.writeValueAsString(Map.of(
                "name", "Cutting", "description", "Cut material", "materialCode", "MC-001"));
        ChangeRequest cr = buildCr(1L, "ADD_OPERATION", data, 1);
        when(changeRequestMapper.selectOne(any())).thenReturn(cr);
        when(operationMapper.selectByRouteId(200L)).thenReturn(List.of());
        when(operationMapper.insert(any(Operation.class))).thenReturn(1);

        callback.onApproved(200L, 10L);

        ArgumentCaptor<Operation> captor = ArgumentCaptor.forClass(Operation.class);
        verify(operationMapper).insert(captor.capture());
        Operation inserted = captor.getValue();
        assertEquals(200L, inserted.getRouteId());
        assertEquals("Cutting", inserted.getName());
        assertEquals(1, inserted.getStatus());

        assertEquals(2, cr.getStatus());
        verify(changeRequestMapper).updateById(cr);
    }

    @Test
    @DisplayName("onApproved: applies UPDATE_OPERATION change")
    void onApproved_updateOperation_modifiesOperation() throws Exception {
        String data = objectMapper.writeValueAsString(Map.of(
                "operationId", 50L, "name", "Updated Op"));
        ChangeRequest cr = buildCr(2L, "UPDATE_OPERATION", data, 1);
        when(changeRequestMapper.selectOne(any())).thenReturn(cr);

        Operation existing = new Operation();
        existing.setId(50L);
        existing.setRouteId(200L);
        existing.setName("Old Op");
        when(operationMapper.selectById(50L)).thenReturn(existing);
        when(operationMapper.updateById(any(Operation.class))).thenReturn(1);

        callback.onApproved(200L, 10L);

        assertEquals("Updated Op", existing.getName());
        verify(operationMapper).updateById(existing);
        assertEquals(2, cr.getStatus());
    }

    @Test
    @DisplayName("onApproved: applies DELETE_OPERATION change")
    void onApproved_deleteOperation_deletesOperation() throws Exception {
        String data = objectMapper.writeValueAsString(Map.of("operationId", 50L));
        ChangeRequest cr = buildCr(3L, "DELETE_OPERATION", data, 1);
        when(changeRequestMapper.selectOne(any())).thenReturn(cr);

        callback.onApproved(200L, 10L);

        verify(operationMapper).deleteById(50L);
        assertEquals(2, cr.getStatus());
    }

    @Test
    @DisplayName("onApproved: skips when ChangeRequest not found")
    void onApproved_notFound_skips() {
        when(changeRequestMapper.selectOne(any())).thenReturn(null);

        callback.onApproved(999L, 10L);

        verifyNoInteractions(operationMapper);
    }

    @Test
    @DisplayName("onRejected: sets status to 3")
    void onRejected_setsStatus3() {
        ChangeRequest cr = buildCr(1L, "ADD_OPERATION", "{}", 1);
        when(changeRequestMapper.selectOne(any())).thenReturn(cr);

        callback.onRejected(200L, "not needed");

        assertEquals(3, cr.getStatus());
        verify(changeRequestMapper).updateById(cr);
    }
}
