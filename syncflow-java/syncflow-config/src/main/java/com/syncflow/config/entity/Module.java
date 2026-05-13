package com.syncflow.config.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Module entity in the module library.
 * Maps to the {@code cfg_module} table.
 */
@Data
@TableName("cfg_module")
public class Module {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to cfg_module_category.id. */
    private Long categoryId;

    /** Unique module code. */
    private String code;

    /** Module name. */
    private String name;

    /** Module description. */
    private String description;

    /** Status: 0=disabled, 1=enabled. */
    private Integer status;

    /** Display order within the same category. */
    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
