package com.syncflow.config.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Module category (tree structure) in the module library.
 * Maps to the {@code cfg_module_category} table.
 */
@Data
@TableName("cfg_module_category")
public class ModuleCategory {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** Category name. */
    private String name;

    /** Unique category code. */
    private String code;

    /** FK to cfg_module_category.id for parent-child hierarchy. */
    private Long parentId;

    /** Materialised ancestor path for fast tree queries. */
    private String path;

    /** Depth level in the tree (root = 0). */
    private Integer level;

    /** Display order within the same parent. */
    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
