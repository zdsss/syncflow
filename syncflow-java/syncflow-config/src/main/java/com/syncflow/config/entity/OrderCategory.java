package com.syncflow.config.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Order category (tree structure) in the order library.
 * Maps to the {@code cfg_order_category} table.
 */
@Data
@TableName("cfg_order_category")
public class OrderCategory {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** Category name. */
    private String name;

    /** Unique category code. */
    private String code;

    /** Depth level in the tree (root = 0). */
    private Integer level;

    /** FK to cfg_order_category.id for parent-child hierarchy. */
    private Long parentId;

    /** Materialised ancestor path for fast tree queries. */
    private String path;

    /** Display order within the same parent. */
    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
