package com.syncflow.task.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.task.entity.TaskDependency;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface TaskDependencyMapper extends BaseMapper<TaskDependency> {
}
