package com.syncflow.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.project.entity.Project;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * MyBatis-Plus mapper for {@link Project}.
 */
@Mapper
public interface ProjectMapper extends BaseMapper<Project> {

    /**
     * Select all non-deleted projects ordered by code.
     * Used for building project tree structures.
     *
     * @return list of all active projects sorted by code
     */
    @Select("SELECT * FROM prj_project WHERE deleted_at IS NULL ORDER BY code")
    List<Project> selectProjectTree();
}
