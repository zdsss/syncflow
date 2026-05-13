package com.syncflow.project.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * Lightweight mapper for sys_user table, used only for owner name lookup.
 * Avoids a full dependency on the admin module.
 */
@Mapper
public interface SysUserMapper {

    /**
     * Fetch the display name (real_name) for a given user id.
     *
     * @param id the user id
     * @return the real name, or null if not found
     */
    @Select("SELECT real_name FROM sys_user WHERE id = #{id} AND deleted_at IS NULL")
    String selectRealNameById(@Param("id") Long id);
}
