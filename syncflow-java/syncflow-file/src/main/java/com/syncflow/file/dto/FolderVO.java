package com.syncflow.file.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * View object for folder display with children tree.
 */
@Data
public class FolderVO {

    private Long id;

    private String name;

    private Long parentId;

    private String path;

    private Long projectId;

    private Long ownerId;

    private Boolean isPublic;

    private Long tenantId;

    /** Child folders (recursive). */
    private List<FolderVO> children;

    /** Count of files directly in this folder. */
    private Integer fileCount;

    private LocalDateTime createdAt;
}
