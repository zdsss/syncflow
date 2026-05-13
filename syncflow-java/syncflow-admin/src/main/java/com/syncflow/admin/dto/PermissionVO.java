package com.syncflow.admin.dto;

import lombok.Data;

/**
 * Permission view object
 */
@Data
public class PermissionVO {

    private Long id;

    private String code;

    private String name;

    private String type;

    private Long parentId;

    private String path;

    private String icon;

    private Integer sortOrder;
}
