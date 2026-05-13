package com.syncflow.project.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.project.entity.ProjectMember;
import org.apache.ibatis.annotations.Mapper;

/**
 * MyBatis-Plus mapper for {@link ProjectMember}.
 */
@Mapper
public interface ProjectMemberMapper extends BaseMapper<ProjectMember> {
}
