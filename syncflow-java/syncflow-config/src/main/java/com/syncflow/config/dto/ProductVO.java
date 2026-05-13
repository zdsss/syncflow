package com.syncflow.config.dto;

import lombok.Data;

/**
 * Order product view object with enriched category name.
 */
@Data
public class ProductVO {

    private Long id;

    private String code;

    private String name;

    private String description;

    private Integer status;

    private String categoryName;
}
