package com.syncflow.config.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.config.entity.SpecParam;
import com.syncflow.config.mapper.SpecParamMapper;
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

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SpecChangeApprovalCallback")
class SpecChangeApprovalCallbackTest {

    @Mock
    private ChangeRequestMapper changeRequestMapper;

    @Mock
    private SpecParamMapper specParamMapper;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private SpecChangeApprovalCallback callback;

    private ChangeRequest buildCr(Long id, String changeType, String changeData, int status) {
        ChangeRequest cr = new ChangeRequest();
        cr.setId(id);
        cr.setObjectType("SPEC_CHANGE");
        cr.setObjectId(300L);
        cr.setChangeType(changeType);
        cr.setChangeData(changeData);
        cr.setStatus(status);
        return cr;
    }

    @Test
    @DisplayName("supportedObjectTypes: returns SPEC_CHANGE")
    void supportedObjectTypes_returnsSpecChange() {
        assertEquals(java.util.Set.of("SPEC_CHANGE"), callback.supportedObjectTypes());
    }

    @Test
    @DisplayName("onApproved: applies ADD_PARAM change")
    void onApproved_addParam_insertsSpecParam() throws Exception {
        String data = objectMapper.writeValueAsString(Map.of(
                "paramName", "Wall Thickness", "paramType", "NUMBER",
                "controlType", "INPUT", "unit", "mm", "isRequired", true));
        ChangeRequest cr = buildCr(1L, "ADD_PARAM", data, 1);
        when(changeRequestMapper.selectOne(any())).thenReturn(cr);
        when(specParamMapper.insert(any(SpecParam.class))).thenReturn(1);

        callback.onApproved(300L, 10L);

        ArgumentCaptor<SpecParam> captor = ArgumentCaptor.forClass(SpecParam.class);
        verify(specParamMapper).insert(captor.capture());
        SpecParam inserted = captor.getValue();
        assertEquals(300L, inserted.getSpecId());
        assertEquals("Wall Thickness", inserted.getParamName());
        assertEquals("NUMBER", inserted.getParamType());
        assertEquals("mm", inserted.getUnit());

        assertEquals(2, cr.getStatus());
        verify(changeRequestMapper).updateById(cr);
    }

    @Test
    @DisplayName("onApproved: applies UPDATE_PARAM change")
    void onApproved_updateParam_modifiesSpecParam() throws Exception {
        String data = objectMapper.writeValueAsString(Map.of(
                "paramId", 50L, "paramName", "Updated Param", "defaultValue", "10"));
        ChangeRequest cr = buildCr(2L, "UPDATE_PARAM", data, 1);
        when(changeRequestMapper.selectOne(any())).thenReturn(cr);

        SpecParam existing = new SpecParam();
        existing.setId(50L);
        existing.setSpecId(300L);
        existing.setParamName("Old Param");
        when(specParamMapper.selectById(50L)).thenReturn(existing);
        when(specParamMapper.updateById(any(SpecParam.class))).thenReturn(1);

        callback.onApproved(300L, 10L);

        assertEquals("Updated Param", existing.getParamName());
        assertEquals("10", existing.getDefaultValue());
        verify(specParamMapper).updateById(existing);
        assertEquals(2, cr.getStatus());
    }

    @Test
    @DisplayName("onApproved: applies DELETE_PARAM change")
    void onApproved_deleteParam_deletesSpecParam() throws Exception {
        String data = objectMapper.writeValueAsString(Map.of("paramId", 50L));
        ChangeRequest cr = buildCr(3L, "DELETE_PARAM", data, 1);
        when(changeRequestMapper.selectOne(any())).thenReturn(cr);

        callback.onApproved(300L, 10L);

        verify(specParamMapper).deleteById(50L);
        assertEquals(2, cr.getStatus());
    }

    @Test
    @DisplayName("onApproved: skips when ChangeRequest not found")
    void onApproved_notFound_skips() {
        when(changeRequestMapper.selectOne(any())).thenReturn(null);

        callback.onApproved(999L, 10L);

        verifyNoInteractions(specParamMapper);
    }

    @Test
    @DisplayName("onRejected: sets status to 3")
    void onRejected_setsStatus3() {
        ChangeRequest cr = buildCr(1L, "ADD_PARAM", "{}", 1);
        when(changeRequestMapper.selectOne(any())).thenReturn(cr);

        callback.onRejected(300L, "not needed");

        assertEquals(3, cr.getStatus());
        verify(changeRequestMapper).updateById(cr);
    }
}
