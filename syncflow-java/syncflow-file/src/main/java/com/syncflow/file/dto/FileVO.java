package com.syncflow.file.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FileVO {

    private Long id;

    private String fileNo;

    private String name;

    private String originalName;

    private String extension;

    private String mimeType;

    private Long size;

    private String sizeLabel;

    private String storagePath;

    private String bucket;

    private Long projectId;

    private String bizType;

    private Long bizId;

    private Integer version;

    private Boolean isLatest;

    private Integer status;

    private String flowInstanceId;

    private Long lockedBy;

    private LocalDateTime lockedAt;

    private LocalDateTime publishedAt;

    private Long publishedBy;

    private Long uploaderId;

    private Long tenantId;

    // ---- Enriched display fields ----

    private String uploaderName;

    private String folderName;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // ---- Frontend-aligned fields ----

    @JsonProperty("type")
    public String getFileType() {
        return extension;
    }

    private String project;

    private String statusLabel;

    @JsonProperty("modifiedDate")
    public String getModifiedDate() {
        return updatedAt != null ? updatedAt.toLocalDate().toString().replace("-", "") : null;
    }
}
