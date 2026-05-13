package com.syncflow.config.dto;

import lombok.Data;

import java.util.List;

/**
 * Category tree view object (recursive structure).
 */
@Data
public class CategoryTreeVO {

    private Long id;

    private String name;

    private String code;

    private Integer level;

    private List<CategoryTreeVO> children;
}
