package com.syncflow.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.admin.entity.UserRole;
import org.apache.ibatis.annotations.Mapper;

/**
 * User-Role association mapper
 */
@Mapper
public interface UserRoleMapper extends BaseMapper<UserRole> {
}
