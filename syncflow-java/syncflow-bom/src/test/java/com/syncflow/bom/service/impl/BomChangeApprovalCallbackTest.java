package com.syncflow.bom.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.bom.entity.BomItem;
import com.syncflow.bom.mapper.BomItemMapper;
import com.syncflow.bom.mapper.BomMapper;
import com.syncflow.workflow.entity.ChangeRequest;
import com.syncflow.workflow.mapper.ChangeRequestMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BomChangeApprovalCallback")
class BomChangeApprovalCallbackTest {

    @Mock
    private ChangeRequestMapper changeRequestMapper;

    @Mock
    private BomItemMapper bomItemMapper;

    @Mock
    private BomMapper bomMapper;

    // Use a real ObjectMapper — @Spy is incompatible with Java 25 for this class
    private final ObjectMapper objectMapper = new ObjectMapper();

    private BomChangeApprovalCallback callback;

    @BeforeEach
    void setUp() {
        callback = new BomChangeApprovalCallback(changeRequestMapper, bomItemMapper, bomMapper, objectMapper);
    }

    private ChangeRequest buildCr(Long id, String changeType, String changeData, int status) {
        ChangeRequest cr = new ChangeRequest();
        cr.setId(id);
        cr.setObjectType("BOM_CHANGE");
        cr.setObjectId(100L);
        cr.setChangeType(changeType);
        cr.setChangeData(changeData);
        cr.setStatus(status);
        return cr;
    }

    @Test
    @DisplayName("supportedObjectTypes: returns BOM_CHANGE")
    void supportedObjectTypes_returnsBomChange() {
        assertEquals(java.util.Set.of("BOM_CHANGE"), callback.supportedObjectTypes());
    }

    @Test
    @DisplayName("onApproved: applies ADD_ITEM change")
    void onApproved_addItem_insertsBomItem() throws Exception {
        String data = objectMapper.writeValueAsString(Map.of(
                "name", "New Part", "materialCode", "MP-001", "quantity", 5));
        ChangeRequest cr = buildCr(1L, "ADD_ITEM", data, 1);
        when(changeRequestMapper.selectById(1L)).thenReturn(cr);
        when(bomItemMapper.insert(any(BomItem.class))).thenReturn(1);

        callback.onApproved(1L, 10L);

        ArgumentCaptor<BomItem> captor = ArgumentCaptor.forClass(BomItem.class);
        verify(bomItemMapper).insert(captor.capture());
        BomItem inserted = captor.getValue();
        assertEquals(100L, inserted.getBomId());
        assertEquals("New Part", inserted.getName());
        assertEquals("MP-001", inserted.getMaterialCode());

        assertEquals(2, cr.getStatus());
        assertEquals(10L, cr.getResolvedBy());
        verify(changeRequestMapper).updateById(cr);
    }

    @Test
    @DisplayName("onApproved: applies UPDATE_ITEM change")
    void onApproved_updateItem_modifiesBomItem() throws Exception {
        String data = objectMapper.writeValueAsString(Map.of(
                "itemId", 50L, "name", "Updated Part", "quantity", 10));
        ChangeRequest cr = buildCr(2L, "UPDATE_ITEM", data, 1);
        when(changeRequestMapper.selectById(2L)).thenReturn(cr);

        BomItem existing = new BomItem();
        existing.setId(50L);
        existing.setBomId(100L);
        existing.setName("Old Part");
        when(bomItemMapper.selectById(50L)).thenReturn(existing);
        when(bomItemMapper.updateById(any(BomItem.class))).thenReturn(1);

        callback.onApproved(2L, 10L);

        assertEquals("Updated Part", existing.getName());
        verify(bomItemMapper).updateById(existing);
        assertEquals(2, cr.getStatus());
    }

    @Test
    @DisplayName("onApproved: applies DELETE_ITEM change")
    void onApproved_deleteItem_deletesBomItem() throws Exception {
        String data = objectMapper.writeValueAsString(Map.of("itemId", 50L));
        ChangeRequest cr = buildCr(3L, "DELETE_ITEM", data, 1);
        when(changeRequestMapper.selectById(3L)).thenReturn(cr);
        when(bomItemMapper.selectList(any())).thenReturn(Collections.emptyList());

        callback.onApproved(3L, 10L);

        verify(bomItemMapper).deleteById(50L);
        assertEquals(2, cr.getStatus());
    }

    @Test
    @DisplayName("onApproved: skips when ChangeRequest not found")
    void onApproved_notFound_skips() {
        when(changeRequestMapper.selectById(anyLong())).thenReturn(null);

        callback.onApproved(999L, 10L);

        verifyNoInteractions(bomItemMapper);
    }

    @Test
    @DisplayName("onApproved: idempotent — skips if already applied (status=2)")
    void onApproved_alreadyApplied_skips() {
        ChangeRequest cr = buildCr(1L, "ADD_ITEM", "{}", 2);
        when(changeRequestMapper.selectById(1L)).thenReturn(cr);

        callback.onApproved(1L, 10L);

        verifyNoInteractions(bomItemMapper);
        verify(changeRequestMapper, never()).updateById(any(ChangeRequest.class));
    }

    @Test
    @DisplayName("onApproved: ADD_ITEM with unitOfMeasure field maps to unit")
    void onApproved_addItem_unitOfMeasureFallback() throws Exception {
        // Frontend sends "unitOfMeasure", not "unit" — callback must handle both
        String data = objectMapper.writeValueAsString(Map.of(
                "name", "Bolt M5", "quantity", 10, "unitOfMeasure", "pcs"));
        ChangeRequest cr = buildCr(10L, "ADD_ITEM", data, 1);
        when(changeRequestMapper.selectById(10L)).thenReturn(cr);
        when(bomItemMapper.insert(any(BomItem.class))).thenReturn(1);

        callback.onApproved(10L, 10L);

        ArgumentCaptor<BomItem> captor = ArgumentCaptor.forClass(BomItem.class);
        verify(bomItemMapper).insert(captor.capture());
        assertEquals("pcs", captor.getValue().getUnit());
    }

    @Test
    @DisplayName("onApproved: ADD_ITEM with parent computes tree metadata")
    void onApproved_addItem_withParent_computesTreeMetadata() throws Exception {
        BomItem parent = new BomItem();
        parent.setId(20L);
        parent.setLevel(1);
        parent.setPath(null);
        parent.setLevelNo("1");

        String data = objectMapper.writeValueAsString(Map.of(
                "name", "Child Part", "quantity", 2, "parentId", 20L, "seqNo", 3));
        ChangeRequest cr = buildCr(11L, "ADD_ITEM", data, 1);
        when(changeRequestMapper.selectById(11L)).thenReturn(cr);
        when(bomItemMapper.selectById(20L)).thenReturn(parent);
        when(bomItemMapper.insert(any(BomItem.class))).thenReturn(1);

        callback.onApproved(11L, 10L);

        ArgumentCaptor<BomItem> captor = ArgumentCaptor.forClass(BomItem.class);
        verify(bomItemMapper).insert(captor.capture());
        BomItem inserted = captor.getValue();
        assertEquals(2, inserted.getLevel());
        assertEquals("1.3", inserted.getLevelNo());
        assertEquals(String.valueOf(parent.getId()), inserted.getPath());
    }

    @Test
    @DisplayName("onApproved: DELETE_ITEM cascades to children")
    void onApproved_deleteItem_cascadesChildren() throws Exception {
        BomItem child = new BomItem();
        child.setId(60L);

        String data = objectMapper.writeValueAsString(Map.of("itemId", 50L));
        ChangeRequest cr = buildCr(12L, "DELETE_ITEM", data, 1);
        when(changeRequestMapper.selectById(12L)).thenReturn(cr);
        // First call returns child, second call (for child) returns empty
        when(bomItemMapper.selectList(any()))
                .thenReturn(java.util.List.of(child))
                .thenReturn(Collections.emptyList());

        callback.onApproved(12L, 10L);

        verify(bomItemMapper).deleteById(60L);
        verify(bomItemMapper).deleteById(50L);
    }

    @Test
    @DisplayName("onRejected: sets status to 3")
    void onRejected_setsStatus3() {
        ChangeRequest cr = buildCr(1L, "ADD_ITEM", "{}", 1);
        when(changeRequestMapper.selectById(1L)).thenReturn(cr);

        callback.onRejected(1L, "not needed");

        assertEquals(3, cr.getStatus());
        verify(changeRequestMapper).updateById(cr);
    }

    @Test
    @DisplayName("onWithdrawn: sets status to 4 (withdrawn, distinct from rejected)")
    void onWithdrawn_setsStatus4() {
        ChangeRequest cr = buildCr(1L, "ADD_ITEM", "{}", 1);
        when(changeRequestMapper.selectById(1L)).thenReturn(cr);

        callback.onWithdrawn(1L);

        assertEquals(4, cr.getStatus());
        verify(changeRequestMapper).updateById(cr);
    }
}
