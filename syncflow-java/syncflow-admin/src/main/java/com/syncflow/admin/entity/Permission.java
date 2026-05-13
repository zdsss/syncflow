package com.syncflow.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * System Permission entity
 */
@Data
@TableName("sys_permission")
public class Permission {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String code;

    private String name;

    private String type;

    private Long parentId;

    private String path;

    private String icon;

    private Integer sortOrder;
}
