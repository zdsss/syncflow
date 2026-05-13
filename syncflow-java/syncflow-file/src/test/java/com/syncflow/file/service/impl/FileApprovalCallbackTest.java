package com.syncflow.file.service.impl;

import com.syncflow.file.entity.FileEntity;
import com.syncflow.file.mapper.FileMapper;
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
@DisplayName("FileApprovalCallback")
class FileApprovalCallbackTest {

    @Mock
    private FileMapper fileMapper;

    @InjectMocks
    private FileApprovalCallback callback;

    private FileEntity buildFile(Long id) {
        FileEntity f = new FileEntity();
        f.setId(id);
        f.setStatus(1);
        f.setFlowInstanceId("flow-file-1");
        return f;
    }

    @Test
    @DisplayName("supportedObjectTypes returns FILE and biz-type variants")
    void supportedObjectTypes() {
        assertTrue(callback.supportedObjectTypes().contains("FILE"));
        assertTrue(callback.supportedObjectTypes().contains("FILE_BOM"));
        assertTrue(callback.supportedObjectTypes().contains("FILE_PROCESS"));
        assertTrue(callback.supportedObjectTypes().contains("FILE_DOCUMENT"));
        assertEquals(4, callback.supportedObjectTypes().size());
    }

    @Test
    @DisplayName("onApproved: sets status=1, publishedAt, publishedBy, clears flowInstanceId")
    void onApproved_setsPublished() {
        FileEntity f = buildFile(1L);
        when(fileMapper.selectById(1L)).thenReturn(f);
        when(fileMapper.updateById(any(FileEntity.class))).thenReturn(1);

        callback.onApproved(1L, 42L);

        assertEquals(1, f.getStatus());
        assertNotNull(f.getPublishedAt());
        assertEquals(42L, f.getPublishedBy());
        assertNull(f.getFlowInstanceId());
        verify(fileMapper).updateById(f);
    }

    @Test
    @DisplayName("onRejected: clears flowInstanceId, preserves status")
    void onRejected_clearsFlow() {
        FileEntity f = buildFile(1L);
        when(fileMapper.selectById(1L)).thenReturn(f);
        when(fileMapper.updateById(any(FileEntity.class))).thenReturn(1);

        callback.onRejected(1L, "Invalid format");

        assertEquals(1, f.getStatus());
        assertNull(f.getFlowInstanceId());
    }

    @Test
    @DisplayName("onWithdrawn: clears flowInstanceId")
    void onWithdrawn_clearsFlow() {
        FileEntity f = buildFile(1L);
        when(fileMapper.selectById(1L)).thenReturn(f);
        when(fileMapper.updateById(any(FileEntity.class))).thenReturn(1);

        callback.onWithdrawn(1L);

        assertNull(f.getFlowInstanceId());
    }

    @Test
    @DisplayName("onApproved: handles missing file gracefully")
    void onApproved_missing_noException() {
        when(fileMapper.selectById(999L)).thenReturn(null);

        assertDoesNotThrow(() -> callback.onApproved(999L, 1L));
        verify(fileMapper, never()).updateById(any(FileEntity.class));
    }

    @Test
    @DisplayName("onRejected: handles missing file gracefully")
    void onRejected_missing_noException() {
        when(fileMapper.selectById(999L)).thenReturn(null);

        assertDoesNotThrow(() -> callback.onRejected(999L, "reason"));
        verify(fileMapper, never()).updateById(any(FileEntity.class));
    }

    @Test
    @DisplayName("onWithdrawn: handles missing file gracefully")
    void onWithdrawn_missing_noException() {
        when(fileMapper.selectById(999L)).thenReturn(null);

        assertDoesNotThrow(() -> callback.onWithdrawn(999L));
        verify(fileMapper, never()).updateById(any(FileEntity.class));
    }
}
