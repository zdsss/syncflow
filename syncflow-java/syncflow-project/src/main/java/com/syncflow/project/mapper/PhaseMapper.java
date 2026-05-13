package com.syncflow.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.project.entity.ProjectPhase;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * MyBatis-Plus mapper for {@link ProjectPhase}.
 */
@Mapper
public interface PhaseMapper extends BaseMapper<ProjectPhase> {

    /**
     * Select all phases for a given project, ordered by sequence number.
     *
     * @param projectId the project id
     * @return ordered list of phases
     */
    @Select("SELECT * FROM prj_phase WHERE project_id = #{projectId} ORDER BY seq_no")
    List<ProjectPhase> selectByProjectId(@Param("projectId") Long projectId);
}
