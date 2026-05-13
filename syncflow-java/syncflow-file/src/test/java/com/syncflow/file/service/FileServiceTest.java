package com.syncflow.file.service;

import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.file.entity.FileEntity;
import com.syncflow.file.mapper.FileMapper;
import com.syncflow.file.mapper.FileVersionMapper;
import com.syncflow.file.mapper.FolderMapper;
import com.syncflow.admin.mapper.UserMapper;
import com.syncflow.file.service.impl.FileServiceImpl;
import com.syncflow.workflow.entity.BusinessObject;
import com.syncflow.workflow.service.WorkflowService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FileService")
class FileServiceTest {

    @Mock
    private FileMapper fileMapper;

    @Mock
    private FolderMapper folderMapper;

    @Mock
    private FileVersionMapper fileVersionMapper;

    @Mock
    private UserMapper userMapper;

    @Mock
    private WorkflowService workflowService;

    private FileServiceImpl fileService;
    private MockedStatic<SecurityUtils> securityUtilsMock;

    @BeforeEach
    void setUp() {
        fileService = new FileServiceImpl(fileMapper, folderMapper,
                fileVersionMapper, userMapper, null);
        fileService.setWorkflowService(workflowService);
        securityUtilsMock = Mockito.mockStatic(SecurityUtils.class);
        securityUtilsMock.when(SecurityUtils::getUserId).thenReturn(1L);
    }

    @AfterEach
    void tearDown() {
        if (securityUtilsMock != null) {
            securityUtilsMock.close();
        }
    }

    private FileEntity buildFileEntity(Long id, int status) {
        FileEntity entity = new FileEntity();
        entity.setId(id);
        entity.setOriginalName("test.pdf");
        entity.setStatus(status);
        entity.setProjectId(1L);
        entity.setUploaderId(1L);
        return entity;
    }

    @Test
    @DisplayName("publishFile: active file starts FILE_APPROVAL workflow")
    void publishFile_activeFile_startsWorkflow() {
        FileEntity entity = buildFileEntity(1L, 1);
        when(fileMapper.selectById(1L)).thenReturn(entity);
        when(workflowService.startProcess(
                eq("FILE_APPROVAL"), eq(1L), eq("FILE"),
                anyString(), eq(1L), anyLong()))
                .thenReturn(100L);

        BusinessObject bo = new BusinessObject();
        bo.setFlowInstanceId("flow-123");
        when(workflowService.getBusinessObjectEntity(100L)).thenReturn(bo);
        when(fileMapper.updateById(any(FileEntity.class))).thenReturn(1);

        fileService.publishFile(1L);

        verify(workflowService).startProcess(
                eq("FILE_APPROVAL"), eq(1L), eq("FILE"),
                anyString(), eq(1L), eq(1L));
        assertEquals("flow-123", entity.getFlowInstanceId());
        verify(fileMapper).updateById(entity);
    }

    @Test
    @DisplayName("publishFile: non-active file throws")
    void publishFile_nonActive_throws() {
        FileEntity entity = buildFileEntity(1L, 0); // deleted
        when(fileMapper.selectById(1L)).thenReturn(entity);

        assertThrows(BusinessException.class, () -> fileService.publishFile(1L));

        verifyNoInteractions(workflowService);
    }

    @Test
    @DisplayName("publishFile: file not found throws")
    void publishFile_notFound_throws() {
        when(fileMapper.selectById(999L)).thenReturn(null);

        assertThrows(BusinessException.class, () -> fileService.publishFile(999L));
    }
}
