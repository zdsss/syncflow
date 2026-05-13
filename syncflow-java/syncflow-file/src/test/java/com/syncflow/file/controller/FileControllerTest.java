package com.syncflow.file.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.file.dto.*;
import com.syncflow.file.service.FileService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FileController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class FileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FileService fileService;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private UploadResultVO buildUploadResultVO() {
        UploadResultVO vo = new UploadResultVO();
        vo.setFileId(1L);
        vo.setFileNo("FILE-001");
        vo.setName("test-file.pdf");
        vo.setSize(1024L);
        vo.setUrl("/files/1/download");
        return vo;
    }

    private FileVO buildFileVO() {
        FileVO vo = new FileVO();
        vo.setId(1L);
        vo.setFileNo("FILE-001");
        vo.setName("stored-name.pdf");
        vo.setOriginalName("test-file.pdf");
        vo.setExtension("pdf");
        vo.setMimeType("application/pdf");
        vo.setSize(1024L);
        vo.setSizeLabel("1.0 KB");
        vo.setProjectId(20L);
        vo.setStatus(1);
        vo.setVersion(1);
        vo.setIsLatest(true);
        vo.setCreatedAt(LocalDateTime.now());
        return vo;
    }

    private FolderVO buildFolderVO() {
        FolderVO vo = new FolderVO();
        vo.setId(1L);
        vo.setName("Design Docs");
        vo.setProjectId(20L);
        vo.setChildren(Collections.emptyList());
        vo.setFileCount(5);
        vo.setCreatedAt(LocalDateTime.now());
        return vo;
    }

    private FileVersionVO buildFileVersionVO() {
        FileVersionVO vo = new FileVersionVO();
        vo.setId(1L);
        vo.setFileId(1L);
        vo.setVersion(1);
        vo.setStoragePath("/bucket/path/file.pdf");
        vo.setSize(1024L);
        vo.setChangeSummary("Initial upload");
        vo.setUploaderId(1L);
        vo.setUploaderName("admin");
        vo.setCreatedAt(LocalDateTime.now());
        return vo;
    }

    // -----------------------------------------------------------------------
    //  POST /api/files/upload
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/files/upload")
    class UploadFile {

        @Test
        @DisplayName("should upload a file via multipart")
        void shouldUploadFile() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test-file.pdf", "application/pdf",
                    "hello world".getBytes());

            when(fileService.uploadFile(any(), eq(20L), eq("BOM"), eq(1L)))
                    .thenReturn(buildUploadResultVO());

            mockMvc.perform(multipart("/api/files/upload")
                            .file(file)
                            .param("projectId", "20")
                            .param("bizType", "BOM")
                            .param("bizId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.fileId").value(1))
                    .andExpect(jsonPath("$.data.fileNo").value("FILE-001"))
                    .andExpect(jsonPath("$.data.name").value("test-file.pdf"))
                    .andExpect(jsonPath("$.data.size").value(1024));
        }

        @Test
        @DisplayName("should upload a file without optional params")
        void shouldUploadFileWithoutOptionalParams() throws Exception {
            MockMultipartFile file = new MockMultipartFile(
                    "file", "test.txt", "text/plain",
                    "content".getBytes());

            when(fileService.uploadFile(any(), isNull(), isNull(), isNull()))
                    .thenReturn(buildUploadResultVO());

            mockMvc.perform(multipart("/api/files/upload").file(file))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/files/{id}/download
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/files/{id}/download")
    class DownloadFile {

        @Test
        @DisplayName("should return file content with correct headers")
        void shouldDownloadFile() throws Exception {
            FileVO detail = buildFileVO();
            InputStream is = new ByteArrayInputStream("file content".getBytes());

            when(fileService.getFileDetail(1L)).thenReturn(detail);
            when(fileService.downloadFile(1L)).thenReturn(is);

            mockMvc.perform(get("/api/files/1/download"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Disposition",
                            "attachment; filename=\"test-file.pdf\""))
                    .andExpect(content().contentType("application/pdf"));
        }

        @Test
        @DisplayName("should return 404 error when file not found")
        void shouldReturn404WhenFileNotFound() throws Exception {
            when(fileService.getFileDetail(999L))
                    .thenThrow(new BusinessException(ErrorCode.FILE_NOT_FOUND));

            mockMvc.perform(get("/api/files/999/download"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(60101));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/files/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/files/{id}")
    class GetFileDetail {

        @Test
        @DisplayName("should return file detail")
        void shouldReturnFileDetail() throws Exception {
            when(fileService.getFileDetail(1L)).thenReturn(buildFileVO());

            mockMvc.perform(get("/api/files/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.originalName").value("test-file.pdf"))
                    .andExpect(jsonPath("$.data.mimeType").value("application/pdf"))
                    .andExpect(jsonPath("$.data.size").value(1024));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/files
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/files")
    class GetFileList {

        @Test
        @DisplayName("should return files filtered by project and bizType")
        void shouldReturnFileList() throws Exception {
            when(fileService.getFileList(20L, "BOM", 1L))
                    .thenReturn(Collections.singletonList(buildFileVO()));

            mockMvc.perform(get("/api/files")
                            .param("projectId", "20")
                            .param("bizType", "BOM")
                            .param("bizId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1));
        }

        @Test
        @DisplayName("should return empty list when no files match")
        void shouldReturnEmptyList() throws Exception {
            when(fileService.getFileList(isNull(), isNull(), isNull()))
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/files"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  DELETE /api/files/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/files/{id}")
    class DeleteFile {

        @Test
        @DisplayName("should soft-delete a file")
        void shouldDeleteFile() throws Exception {
            mockMvc.perform(delete("/api/files/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(fileService).deleteFile(1L);
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/files/folders
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/files/folders")
    class CreateFolder {

        @Test
        @DisplayName("should create a new folder")
        void shouldCreateFolder() throws Exception {
            when(fileService.createFolder("Design Docs", null, 20L))
                    .thenReturn(buildFolderVO());

            mockMvc.perform(post("/api/files/folders")
                            .param("name", "Design Docs")
                            .param("projectId", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.name").value("Design Docs"))
                    .andExpect(jsonPath("$.data.fileCount").value(5));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/files/folders/tree
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/files/folders/tree")
    class GetFolderTree {

        @Test
        @DisplayName("should return folder tree for a project")
        void shouldReturnFolderTree() throws Exception {
            when(fileService.getFolderTree(20L))
                    .thenReturn(Collections.singletonList(buildFolderVO()));

            mockMvc.perform(get("/api/files/folders/tree")
                            .param("projectId", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].name").value("Design Docs"));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/files/{id}/versions
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/files/{id}/versions")
    class GetVersionHistory {

        @Test
        @DisplayName("should return version history for a file")
        void shouldReturnVersionHistory() throws Exception {
            when(fileService.getVersionHistory(1L))
                    .thenReturn(Collections.singletonList(buildFileVersionVO()));

            mockMvc.perform(get("/api/files/1/versions"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].version").value(1))
                    .andExpect(jsonPath("$.data[0].changeSummary").value("Initial upload"));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/files/{id}/publish
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/files/{id}/publish")
    class PublishFile {

        @Test
        @DisplayName("should submit file for publish approval")
        void publishFile_success() throws Exception {
            doNothing().when(fileService).publishFile(1L);

            mockMvc.perform(post("/api/files/1/publish"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(fileService).publishFile(1L);
        }

        @Test
        @DisplayName("should return error when file not active")
        void publishFile_notActive() throws Exception {
            doThrow(new BusinessException(ErrorCode.PARAM_ERROR, "只有活跃状态的文件才能提交发布审批"))
                    .when(fileService).publishFile(1L);

            mockMvc.perform(post("/api/files/1/publish"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.PARAM_ERROR.getCode()));
        }
    }
}
