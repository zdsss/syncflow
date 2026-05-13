package com.syncflow.file.controller;

import com.syncflow.common.result.Result;
import com.syncflow.file.dto.*;
import com.syncflow.file.service.FileService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

/**
 * File management controller.
 */
@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    /**
     * Upload a file via multipart form.
     */
    @PostMapping("/upload")
    public Result<UploadResultVO> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String bizType,
            @RequestParam(required = false) Long bizId) {
        UploadResultVO result = fileService.uploadFile(file, projectId, bizType, bizId);
        return Result.success(result);
    }

    /**
     * Download a file by id. Returns the raw file content.
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> downloadFile(@PathVariable Long id) {
        FileVO detail = fileService.getFileDetail(id);
        InputStream is = fileService.downloadFile(id);

        MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
        if (detail.getMimeType() != null) {
            try {
                mediaType = MediaType.parseMediaType(detail.getMimeType());
            } catch (Exception ignored) {
                // fallback to OCTET_STREAM
            }
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + detail.getOriginalName() + "\"")
                .contentType(mediaType)
                .body(new InputStreamResource(is));
    }

    /**
     * Get file detail by id.
     */
    @GetMapping("/{id}")
    public Result<FileVO> getFileDetail(@PathVariable Long id) {
        FileVO vo = fileService.getFileDetail(id);
        return Result.success(vo);
    }

    /**
     * List files, optionally filtered by project, business type, and business id.
     */
    @GetMapping
    public Result<List<FileVO>> getFileList(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String bizType,
            @RequestParam(required = false) Long bizId) {
        List<FileVO> result = fileService.getFileList(projectId, bizType, bizId);
        return Result.success(result);
    }

    /**
     * Soft-delete a file.
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteFile(@PathVariable Long id) {
        fileService.deleteFile(id);
        return Result.success();
    }

    /**
     * Create a new folder.
     */
    @PostMapping("/folders")
    public Result<FolderVO> createFolder(
            @RequestParam String name,
            @RequestParam(required = false) Long parentId,
            @RequestParam(required = false) Long projectId) {
        FolderVO vo = fileService.createFolder(name, parentId, projectId);
        return Result.success(vo);
    }

    /**
     * Get the folder tree for a project.
     */
    @GetMapping("/folders/tree")
    public Result<List<FolderVO>> getFolderTree(@RequestParam Long projectId) {
        List<FolderVO> tree = fileService.getFolderTree(projectId);
        return Result.success(tree);
    }

    /**
     * Get version history for a file.
     */
    @GetMapping("/{id}/versions")
    public Result<List<FileVersionVO>> getVersionHistory(@PathVariable Long id) {
        List<FileVersionVO> versions = fileService.getVersionHistory(id);
        return Result.success(versions);
    }

    /**
     * Submit a file for publish approval.
     */
    @PostMapping("/{id}/publish")
    public Result<Void> publishFile(@PathVariable Long id) {
        fileService.publishFile(id);
        return Result.success();
    }
}
