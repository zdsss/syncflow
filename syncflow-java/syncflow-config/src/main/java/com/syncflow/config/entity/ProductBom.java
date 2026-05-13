package com.syncflow.config.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Product-to-BOM association entity.
 * Maps to the {@code cfg_product_bom} table.
 */
@Data
@TableName("cfg_product_bom")
public class ProductBom {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to cfg_order_product.id. */
    private Long productId;

    /** FK to bom_bom.id (the linked BOM). */
    private Long bomId;

    /** Whether this is the default BOM for the product. */
    private Boolean isDefault;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
