package com.syncflow.admin.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

/**
 * User-Role association entity
 */
@Data
@TableName("sys_user_role")
public class UserRole {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long roleId;

    /**
     * Permission scope type (e.g. ALL, DEPT, CUSTOM)
     */
    private String scopeType;

    private Long scopeId;
}
