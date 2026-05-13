package com.syncflow.file.service;

import com.syncflow.file.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;

/**
 * File management service interface.
 */
public interface FileService {

    /**
     * Upload a file to MinIO and save metadata.
     *
     * @param file      the multipart file
     * @param projectId optional project association
     * @param bizType   optional business type
     * @param bizId     optional business entity id
     * @return upload result with file id and url
     */
    UploadResultVO uploadFile(MultipartFile file, Long projectId, String bizType, Long bizId);

    /**
     * Get an InputStream for downloading the file from MinIO.
     *
     * @param fileId file id
     * @return input stream of file content
     */
    InputStream downloadFile(Long fileId);

    /**
     * Get file detail with enriched display fields.
     *
     * @param fileId file id
     * @return file view object
     */
    FileVO getFileDetail(Long fileId);

    /**
     * List files filtered by business context.
     *
     * @param projectId optional project id
     * @param bizType   optional business type
     * @param bizId     optional business entity id
     * @return list of file view objects
     */
    List<FileVO> getFileList(Long projectId, String bizType, Long bizId);

    /**
     * Soft-delete a file.
     *
     * @param fileId file id
     */
    void deleteFile(Long fileId);

    /**
     * Create a folder within a project.
     *
     * @param name      folder name
     * @param parentId  optional parent folder id
     * @param projectId optional project id
     * @return created folder view object
     */
    FolderVO createFolder(String name, Long parentId, Long projectId);

    /**
     * Get the full folder tree for a project.
     *
     * @param projectId project id
     * @return list of root folders with nested children
     */
    List<FolderVO> getFolderTree(Long projectId);

    /**
     * Get version history for a file.
     *
     * @param fileId file id
     * @return list of file version records
     */
    List<FileVersionVO> getVersionHistory(Long fileId);

    /**
     * Submit a file for publish approval (starts FILE_APPROVAL workflow).
     *
     * @param fileId file id
     */
    void publishFile(Long fileId);
}
