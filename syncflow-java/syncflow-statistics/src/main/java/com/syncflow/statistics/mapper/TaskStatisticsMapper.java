package com.syncflow.statistics.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.statistics.entity.TaskStatistics;
import org.apache.ibatis.annotations.Mapper;

/**
 * Mapper for aggregated task statistics.
 */
@Mapper
public interface TaskStatisticsMapper extends BaseMapper<TaskStatistics> {
}
