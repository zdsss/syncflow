package com.syncflow.task.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.task.entity.TaskActivity;
import org.apache.ibatis.annotations.Mapper;

/**
 * Task activity (audit trail) mapper.
 */
@Mapper
public interface TaskActivityMapper extends BaseMapper<TaskActivity> {
}
