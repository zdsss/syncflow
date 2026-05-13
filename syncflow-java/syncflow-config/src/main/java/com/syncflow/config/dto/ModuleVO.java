package com.syncflow.config.dto;

import lombok.Data;

/**
 * Module view object with enriched category name.
 */
@Data
public class ModuleVO {

    private Long id;

    private String code;

    private String name;

    private String description;

    private Integer status;

    private String categoryName;
}
