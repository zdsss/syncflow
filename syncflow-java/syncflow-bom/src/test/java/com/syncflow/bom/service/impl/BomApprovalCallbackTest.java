package com.syncflow.bom.service.impl;

import com.syncflow.bom.entity.Bom;
import com.syncflow.bom.enums.BomStatus;
import com.syncflow.bom.mapper.BomMapper;
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
@DisplayName("BomApprovalCallback")
class BomApprovalCallbackTest {

    @Mock
    private BomMapper bomMapper;

    @InjectMocks
    private BomApprovalCallback callback;

    private Bom buildBom(Long id, int status) {
        Bom bom = new Bom();
        bom.setId(id);
        bom.setStatus(status);
        bom.setName("Test BOM");
        return bom;
    }

    @Test
    @DisplayName("supportedObjectTypes: returns BOM")
    void supportedObjectTypes_returnsBom() {
        assertEquals(java.util.Set.of("BOM"), callback.supportedObjectTypes());
    }

    @Test
    @DisplayName("onApproved: sets status to PUBLISHED and approvedBy")
    void onApproved_setsPublished() {
        Bom bom = buildBom(1L, BomStatus.PENDING_APPROVAL.getCode());
        when(bomMapper.selectById(1L)).thenReturn(bom);
        when(bomMapper.updateById(any(Bom.class))).thenReturn(1);

        callback.onApproved(1L, 10L);

        assertEquals(BomStatus.PUBLISHED.getCode(), bom.getStatus());
        assertEquals(10L, bom.getApprovedBy());
        assertNotNull(bom.getApprovedAt());
        verify(bomMapper).updateById(bom);
    }

    @Test
    @DisplayName("onApproved: skips when BOM not found")
    void onApproved_notFound_skips() {
        when(bomMapper.selectById(999L)).thenReturn(null);

        callback.onApproved(999L, 10L);

        verify(bomMapper, never()).updateById(any(Bom.class));
    }

    @Test
    @DisplayName("onRejected: reverts status to EDITING")
    void onRejected_setsEditing() {
        Bom bom = buildBom(1L, BomStatus.PENDING_APPROVAL.getCode());
        when(bomMapper.selectById(1L)).thenReturn(bom);
        when(bomMapper.updateById(any(Bom.class))).thenReturn(1);

        callback.onRejected(1L, "quality issues");

        assertEquals(BomStatus.EDITING.getCode(), bom.getStatus());
        verify(bomMapper).updateById(bom);
    }

    @Test
    @DisplayName("onWithdrawn: reverts status to EDITING")
    void onWithdrawn_setsEditing() {
        Bom bom = buildBom(1L, BomStatus.PENDING_APPROVAL.getCode());
        when(bomMapper.selectById(1L)).thenReturn(bom);
        when(bomMapper.updateById(any(Bom.class))).thenReturn(1);

        callback.onWithdrawn(1L);

        assertEquals(BomStatus.EDITING.getCode(), bom.getStatus());
        verify(bomMapper).updateById(bom);
    }
}
