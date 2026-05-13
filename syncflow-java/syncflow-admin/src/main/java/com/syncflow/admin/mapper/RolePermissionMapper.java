package com.syncflow.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.admin.entity.RolePermission;
import org.apache.ibatis.annotations.Mapper;

/**
 * Role-Permission association mapper
 */
@Mapper
public interface RolePermissionMapper extends BaseMapper<RolePermission> {
}
