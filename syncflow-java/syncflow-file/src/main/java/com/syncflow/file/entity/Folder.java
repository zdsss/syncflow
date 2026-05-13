package com.syncflow.file.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Folder entity for organising files within a project.
 * <p>
 * Maps to the {@code fil_folder} table.
 */
@Data
@TableName("fil_folder")
public class Folder {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** Folder display name. */
    private String name;

    /** FK to fil_folder.id, parent folder (null for root). */
    private Long parentId;

    /** Materialised path for fast tree queries, e.g. "/1/5/12". */
    private String path;

    /** FK to prj_project.id. */
    private Long projectId;

    /** FK to sys_user.id, folder owner. */
    private Long ownerId;

    /** Whether the folder is visible to all project members. */
    private Boolean isPublic;

    /** Tenant identifier for multi-tenancy. */
    private Long tenantId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
