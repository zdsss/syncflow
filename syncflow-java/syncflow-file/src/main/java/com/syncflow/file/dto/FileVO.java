package com.syncflow.file.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * View object for file detail display.
 */
@Data
public class FileVO {

    private Long id;

    private String fileNo;

    /** Stored file name. */
    private String name;

    /** Original upload file name. */
    private String originalName;

    private String extension;

    private String mimeType;

    /** File size in bytes. */
    private Long size;

    /** Human-readable size label, e.g. "2.5 MB". */
    private String sizeLabel;

    private String storagePath;

    private String bucket;

    private Long projectId;

    private String bizType;

    private Long bizId;

    private Integer version;

    private Boolean isLatest;

    /** 1=active, 0=deleted. */
    private Integer status;

    private String flowInstanceId;

    private Long lockedBy;

    private LocalDateTime lockedAt;

    private LocalDateTime publishedAt;

    private Long publishedBy;

    private Long uploaderId;

    private Long tenantId;

    // ---- Enriched display fields ----

    /** Display name of the uploader. */
    private String uploaderName;

    /** Name of the folder containing this file. */
    private String folderName;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
