package com.syncflow.project.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * Lightweight mapper for sys_department table, used only for department name lookup.
 * Avoids a full dependency on the admin module.
 */
@Mapper
public interface SysDepartmentMapper {

    /**
     * Fetch the display name for a given department id.
     *
     * @param id the department id
     * @return the department name, or null if not found
     */
    @Select("SELECT name FROM sys_department WHERE id = #{id} AND deleted_at IS NULL")
    String selectNameById(@Param("id") Long id);
}
