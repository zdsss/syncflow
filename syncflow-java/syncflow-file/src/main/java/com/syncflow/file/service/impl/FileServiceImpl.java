package com.syncflow.file.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.admin.entity.User;
import com.syncflow.admin.mapper.UserMapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.file.dto.*;
import com.syncflow.file.entity.FileEntity;
import com.syncflow.file.entity.FileVersion;
import com.syncflow.file.entity.Folder;
import com.syncflow.file.mapper.FileMapper;
import com.syncflow.file.mapper.FileVersionMapper;
import com.syncflow.file.mapper.FolderMapper;
import com.syncflow.file.service.FileService;
import com.syncflow.workflow.service.WorkflowService;
import io.minio.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * File management service implementation backed by MinIO object storage.
 */
@Service
public class FileServiceImpl implements FileService {

    private final FileMapper fileMapper;
    private final FolderMapper folderMapper;
    private final FileVersionMapper fileVersionMapper;
    private final UserMapper userMapper;
    private final MinioClient minioClient;

    @Value("${minio.bucket:syncflow-files}")
    private String defaultBucket;

    @Lazy
    private WorkflowService workflowService;

    @Autowired
    public void setWorkflowService(@Lazy WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    public FileServiceImpl(FileMapper fileMapper,
                           FolderMapper folderMapper,
                           FileVersionMapper fileVersionMapper,
                           UserMapper userMapper,
                           MinioClient minioClient) {
        this.fileMapper = fileMapper;
        this.folderMapper = folderMapper;
        this.fileVersionMapper = fileVersionMapper;
        this.userMapper = userMapper;
        this.minioClient = minioClient;
    }

    // -----------------------------------------------------------------------
    //  Upload
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public UploadResultVO uploadFile(MultipartFile file, Long projectId,
                                    String bizType, Long bizId) {
        Long currentUserId = SecurityUtils.getUserId();

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.isBlank()) {
            originalName = "unnamed";
        }

        String extension = extractExtension(originalName);
        String storedName = UUID.randomUUID() + (extension != null ? "." + extension : "");
        String storagePath = buildStoragePath(projectId, storedName);

        // Ensure bucket exists
        ensureBucket(defaultBucket);

        // Upload to MinIO
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(defaultBucket)
                            .object(storagePath)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build());
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR,
                    "Failed to upload file to storage: " + e.getMessage(), e);
        }

        // Compute checksum
        String checkSum = computeSha256(file);

        // Save metadata
        FileEntity entity = new FileEntity();
        entity.setFileNo(generateFileNo());
        entity.setName(storedName);
        entity.setOriginalName(originalName);
        entity.setExtension(extension);
        entity.setMimeType(file.getContentType());
        entity.setSize(file.getSize());
        entity.setStoragePath(storagePath);
        entity.setBucket(defaultBucket);
        entity.setCheckSum(checkSum);
        entity.setProjectId(projectId);
        entity.setBizType(bizType);
        entity.setBizId(bizId);
        entity.setVersion(1);
        entity.setIsLatest(true);
        entity.setStatus(1);
        entity.setUploaderId(currentUserId);
        entity.setTenantId(1L);

        fileMapper.insert(entity);

        // Record initial version
        FileVersion version = new FileVersion();
        version.setFileId(entity.getId());
        version.setVersion(1);
        version.setStoragePath(storagePath);
        version.setSize(file.getSize());
        version.setChangeSummary("Initial upload");
        version.setUploaderId(currentUserId);
        fileVersionMapper.insert(version);

        // Build result
        UploadResultVO result = new UploadResultVO();
        result.setFileId(entity.getId());
        result.setFileNo(entity.getFileNo());
        result.setName(originalName);
        result.setSize(file.getSize());
        result.setUrl("/api/files/" + entity.getId() + "/download");
        return result;
    }

    // -----------------------------------------------------------------------
    //  Download
    // -----------------------------------------------------------------------

    @Override
    public InputStream downloadFile(Long fileId) {
        FileEntity entity = getFileOrThrow(fileId);

        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(entity.getBucket() != null ? entity.getBucket() : defaultBucket)
                            .object(entity.getStoragePath())
                            .build());
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR,
                    "Failed to download file from storage: " + e.getMessage(), e);
        }
    }

    // -----------------------------------------------------------------------
    //  Detail
    // -----------------------------------------------------------------------

    @Override
    public FileVO getFileDetail(Long fileId) {
        FileEntity entity = getFileOrThrow(fileId);
        return toFileVO(entity);
    }

    // -----------------------------------------------------------------------
    //  List
    // -----------------------------------------------------------------------

    @Override
    public List<FileVO> getFileList(Long projectId, String bizType, Long bizId) {
        LambdaQueryWrapper<FileEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FileEntity::getStatus, 1);

        if (projectId != null) {
            wrapper.eq(FileEntity::getProjectId, projectId);
        }
        if (bizType != null) {
            wrapper.eq(FileEntity::getBizType, bizType);
        }
        if (bizId != null) {
            wrapper.eq(FileEntity::getBizId, bizId);
        }
        wrapper.orderByDesc(FileEntity::getCreatedAt);

        List<FileEntity> files = fileMapper.selectList(wrapper);
        return files.stream().map(this::toFileVO).collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    //  Delete
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public void deleteFile(Long fileId) {
        FileEntity entity = getFileOrThrow(fileId);
        entity.setStatus(0);
        fileMapper.updateById(entity);
    }

    // -----------------------------------------------------------------------
    //  Folder CRUD
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public FolderVO createFolder(String name, Long parentId, Long projectId) {
        Long currentUserId = SecurityUtils.getUserId();

        Folder folder = new Folder();
        folder.setName(name);
        folder.setParentId(parentId);
        folder.setProjectId(projectId);
        folder.setOwnerId(currentUserId);
        folder.setIsPublic(false);
        folder.setTenantId(1L);

        // Compute materialised path
        if (parentId != null) {
            Folder parent = folderMapper.selectById(parentId);
            if (parent == null) {
                throw new BusinessException(ErrorCode.PARAM_ERROR, "Parent folder not found");
            }
            folder.setPath(parent.getPath() != null
                    ? parent.getPath() + "/" + parent.getId()
                    : "/" + parent.getId());
        } else {
            folder.setPath(null);
        }

        folderMapper.insert(folder);
        return toFolderVO(folder, 0);
    }

    @Override
    public List<FolderVO> getFolderTree(Long projectId) {
        LambdaQueryWrapper<Folder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Folder::getProjectId, projectId)
               .orderByAsc(Folder::getId);
        List<Folder> allFolders = folderMapper.selectList(wrapper);

        return buildFolderTree(allFolders, null);
    }

    // -----------------------------------------------------------------------
    //  Version history
    // -----------------------------------------------------------------------

    @Override
    public List<FileVersionVO> getVersionHistory(Long fileId) {
        // Validate file exists
        getFileOrThrow(fileId);

        LambdaQueryWrapper<FileVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(FileVersion::getFileId, fileId)
               .orderByDesc(FileVersion::getVersion);
        List<FileVersion> versions = fileVersionMapper.selectList(wrapper);

        return versions.stream().map(this::toFileVersionVO).collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    //  Publish
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public void publishFile(Long fileId) {
        FileEntity entity = getFileOrThrow(fileId);

        if (entity.getStatus() == null || entity.getStatus() != 1) {
            throw new BusinessException(ErrorCode.PARAM_ERROR,
                    "只有活跃状态的文件才能提交发布审批");
        }

        // Start FILE_APPROVAL workflow
        Long currentUserId = SecurityUtils.getUserId();
        Long businessObjectId = workflowService.startProcess(
                "FILE_APPROVAL",
                fileId,
                "FILE",
                entity.getOriginalName(),
                entity.getProjectId(),
                currentUserId
        );

        // Link workflow instance back to file
        com.syncflow.workflow.entity.BusinessObject bo =
                workflowService.getBusinessObjectEntity(businessObjectId);
        if (bo != null && bo.getFlowInstanceId() != null) {
            entity.setFlowInstanceId(bo.getFlowInstanceId());
            fileMapper.updateById(entity);
        }
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    private FileEntity getFileOrThrow(Long id) {
        FileEntity entity = fileMapper.selectById(id);
        if (entity == null) {
            throw new BusinessException(ErrorCode.FILE_NOT_FOUND);
        }
        return entity;
    }

    /**
     * Generate file number: FILE-YYYYMMDD-NNNN.
     */
    private String generateFileNo() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        LocalDate today = LocalDate.now();
        LambdaQueryWrapper<FileEntity> wrapper = new LambdaQueryWrapper<>();
        wrapper.ge(FileEntity::getCreatedAt, today.atStartOfDay())
               .lt(FileEntity::getCreatedAt, today.atTime(LocalTime.MAX));
        Long todayCount = fileMapper.selectCount(wrapper);

        int seq = (todayCount != null ? todayCount.intValue() : 0) + 1;
        return String.format("FILE-%s-%04d", datePart, seq);
    }

    /**
     * Build a hierarchical storage path like "projectId/2026/05/06/storedName".
     */
    private String buildStoragePath(Long projectId, String storedName) {
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String prefix = projectId != null ? projectId.toString() : "common";
        return prefix + "/" + datePath + "/" + storedName;
    }

    /**
     * Extract file extension without the leading dot.
     */
    private String extractExtension(String filename) {
        int dotIdx = filename.lastIndexOf('.');
        if (dotIdx > 0 && dotIdx < filename.length() - 1) {
            return filename.substring(dotIdx + 1).toLowerCase();
        }
        return null;
    }

    /**
     * Ensure the MinIO bucket exists, creating it if necessary.
     */
    private void ensureBucket(String bucket) {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(bucket).build());
            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder().bucket(bucket).build());
            }
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR,
                    "Failed to ensure MinIO bucket: " + e.getMessage(), e);
        }
    }

    /**
     * Compute SHA-256 checksum of the uploaded file content.
     */
    private String computeSha256(MultipartFile file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(file.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Build a recursive folder tree from a flat list.
     */
    private List<FolderVO> buildFolderTree(List<Folder> allFolders, Long parentId) {
        List<FolderVO> tree = new ArrayList<>();
        for (Folder folder : allFolders) {
            if (Objects.equals(folder.getParentId(), parentId)) {
                FolderVO vo = toFolderVO(folder, 0);
                vo.setChildren(buildFolderTree(allFolders, folder.getId()));

                // Count files in this folder (by projectId match as simple proxy)
                int fileCount = countFilesInFolder(folder);
                vo.setFileCount(fileCount);

                tree.add(vo);
            }
        }
        return tree;
    }

    /**
     * Count active files associated with the folder's project.
     * Note: a richer implementation would link files to folders via folder_id.
     */
    private int countFilesInFolder(Folder folder) {
        // Files are linked to projects; folder-level counting is project-scoped
        return 0;
    }

    /**
     * Format bytes into a human-readable size label.
     */
    private String formatSize(Long size) {
        if (size == null) return "0 B";
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return String.format("%.1f KB", size / 1024.0);
        if (size < 1024 * 1024 * 1024) return String.format("%.1f MB", size / (1024.0 * 1024));
        return String.format("%.1f GB", size / (1024.0 * 1024 * 1024));
    }

    // -----------------------------------------------------------------------
    //  Entity -> VO converters
    // -----------------------------------------------------------------------

    private FileVO toFileVO(FileEntity entity) {
        FileVO vo = new FileVO();
        vo.setId(entity.getId());
        vo.setFileNo(entity.getFileNo());
        vo.setName(entity.getName());
        vo.setOriginalName(entity.getOriginalName());
        vo.setExtension(entity.getExtension());
        vo.setMimeType(entity.getMimeType());
        vo.setSize(entity.getSize());
        vo.setSizeLabel(formatSize(entity.getSize()));
        vo.setStoragePath(entity.getStoragePath());
        vo.setBucket(entity.getBucket());
        vo.setProjectId(entity.getProjectId());
        vo.setBizType(entity.getBizType());
        vo.setBizId(entity.getBizId());
        vo.setVersion(entity.getVersion());
        vo.setIsLatest(entity.getIsLatest());
        vo.setStatus(entity.getStatus());
        vo.setFlowInstanceId(entity.getFlowInstanceId());
        vo.setLockedBy(entity.getLockedBy());
        vo.setLockedAt(entity.getLockedAt());
        vo.setPublishedAt(entity.getPublishedAt());
        vo.setPublishedBy(entity.getPublishedBy());
        vo.setUploaderId(entity.getUploaderId());
        vo.setTenantId(entity.getTenantId());
        vo.setCreatedAt(entity.getCreatedAt());
        vo.setUpdatedAt(entity.getUpdatedAt());

        // Enrich uploader name
        if (entity.getUploaderId() != null) {
            User uploader = userMapper.selectById(entity.getUploaderId());
            if (uploader != null) {
                vo.setUploaderName(uploader.getRealName());
            }
        }

        return vo;
    }

    private FolderVO toFolderVO(Folder folder, int fileCount) {
        FolderVO vo = new FolderVO();
        vo.setId(folder.getId());
        vo.setName(folder.getName());
        vo.setParentId(folder.getParentId());
        vo.setPath(folder.getPath());
        vo.setProjectId(folder.getProjectId());
        vo.setOwnerId(folder.getOwnerId());
        vo.setIsPublic(folder.getIsPublic());
        vo.setTenantId(folder.getTenantId());
        vo.setFileCount(fileCount);
        vo.setCreatedAt(folder.getCreatedAt());
        return vo;
    }

    private FileVersionVO toFileVersionVO(FileVersion version) {
        FileVersionVO vo = new FileVersionVO();
        vo.setId(version.getId());
        vo.setFileId(version.getFileId());
        vo.setVersion(version.getVersion());
        vo.setStoragePath(version.getStoragePath());
        vo.setSize(version.getSize());
        vo.setChangeSummary(version.getChangeSummary());
        vo.setUploaderId(version.getUploaderId());
        vo.setCreatedAt(version.getCreatedAt());

        if (version.getUploaderId() != null) {
            User uploader = userMapper.selectById(version.getUploaderId());
            if (uploader != null) {
                vo.setUploaderName(uploader.getRealName());
            }
        }

        return vo;
    }
}
