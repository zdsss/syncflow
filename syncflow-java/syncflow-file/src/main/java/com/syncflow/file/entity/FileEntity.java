package com.syncflow.file.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * File metadata entity.
 * <p>
 * Maps to the {@code fil_file} table.
 */
@Data
@TableName("fil_file")
public class FileEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** Auto-generated file number, e.g. FILE-20260506-0001. */
    private String fileNo;

    /** Stored file name (UUID-based). */
    private String name;

    /** Original upload file name. */
    private String originalName;

    /** File extension without dot, e.g. "pdf". */
    private String extension;

    /** MIME type, e.g. "application/pdf". */
    private String mimeType;

    /** File size in bytes. */
    private Long size;

    /** Storage path in MinIO (key). */
    private String storagePath;

    /** MinIO bucket name. */
    private String bucket;

    /** SHA-256 checksum of the file content. */
    private String checkSum;

    /** FK to prj_project.id. */
    private Long projectId;

    /** Business type identifier, e.g. "bom", "task". */
    private String bizType;

    /** Business entity id. */
    private Long bizId;

    /** Version number of this file. */
    private Integer version;

    /** True if this is the latest version. */
    private Boolean isLatest;

    /** 1=active, 0=deleted. */
    private Integer status;

    /** Workflow engine instance identifier. */
    private String flowInstanceId;

    /** FK to sys_user.id, who locked this file. */
    private Long lockedBy;

    /** Timestamp when the file was locked. */
    private LocalDateTime lockedAt;

    /** Timestamp when the file was published. */
    private LocalDateTime publishedAt;

    /** FK to sys_user.id, who published this file. */
    private Long publishedBy;

    /** FK to sys_user.id, the uploader. */
    private Long uploaderId;

    /** Tenant identifier for multi-tenancy. */
    private Long tenantId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
