package com.syncflow.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.admin.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * User mapper
 */
@Mapper
public interface UserMapper extends BaseMapper<User> {

    /**
     * Find user by username (excluding soft-deleted records)
     */
    @Select("SELECT * FROM sys_user WHERE username = #{username} AND deleted_at IS NULL")
    User selectByUsername(@Param("username") String username);
}
