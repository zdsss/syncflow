package com.syncflow.statistics.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.statistics.entity.DashboardData;
import org.apache.ibatis.annotations.Mapper;

/**
 * Mapper for dashboard pre-calculated data.
 */
@Mapper
public interface DashboardDataMapper extends BaseMapper<DashboardData> {
}
