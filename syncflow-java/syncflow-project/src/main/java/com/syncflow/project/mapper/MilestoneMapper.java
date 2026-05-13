package com.syncflow.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.project.entity.Milestone;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * MyBatis-Plus mapper for {@link Milestone}.
 */
@Mapper
public interface MilestoneMapper extends BaseMapper<Milestone> {

    /**
     * Select milestones by project and optional phase.
     * If phaseId is null, returns all milestones for the project.
     *
     * @param projectId the project id (required)
     * @param phaseId   the phase id (optional, may be null)
     * @return list of matching milestones
     */
    @Select({
            "<script>",
            "SELECT * FROM prj_milestone WHERE project_id = #{projectId}",
            "<if test='phaseId != null'> AND phase_id = #{phaseId}</if>",
            " ORDER BY planned_date",
            "</script>"
    })
    List<Milestone> selectByProjectAndPhase(@Param("projectId") Long projectId,
                                            @Param("phaseId") Long phaseId);
}
