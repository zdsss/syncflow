package com.syncflow.file.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * File version history entity.
 * <p>
 * Maps to the {@code fil_file_version} table.
 */
@Data
@TableName("fil_file_version")
public class FileVersion {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to fil_file.id. */
    private Long fileId;

    /** Version number. */
    private Integer version;

    /** Storage path of this version in MinIO. */
    private String storagePath;

    /** File size in bytes for this version. */
    private Long size;

    /** Human-readable summary of changes. */
    private String changeSummary;

    /** FK to sys_user.id, who uploaded this version. */
    private Long uploaderId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
