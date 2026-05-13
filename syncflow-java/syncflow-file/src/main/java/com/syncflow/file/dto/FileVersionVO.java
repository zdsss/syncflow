package com.syncflow.file.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * View object for file version history.
 */
@Data
public class FileVersionVO {

    private Long id;

    private Long fileId;

    private Integer version;

    private String storagePath;

    private Long size;

    private String changeSummary;

    private Long uploaderId;

    /** Display name of the uploader. */
    private String uploaderName;

    private LocalDateTime createdAt;
}
