package com.syncflow.config.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO for creating a new order product.
 */
@Data
public class CreateOrderProductDTO {

    @NotBlank(message = "Product code is required")
    private String code;

    @NotBlank(message = "Product name is required")
    private String name;

    /** FK to cfg_order_category.id. */
    private Long categoryId;

    private String description;
}
