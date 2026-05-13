package com.syncflow.config.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Order product entity in the order library.
 * Maps to the {@code cfg_order_product} table.
 */
@Data
@TableName("cfg_order_product")
public class OrderProduct {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to cfg_order_category.id. */
    private Long categoryId;

    /** Unique product code. */
    private String code;

    /** Product name. */
    private String name;

    /** Product description. */
    private String description;

    /** Status: 0=disabled, 1=enabled. */
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
