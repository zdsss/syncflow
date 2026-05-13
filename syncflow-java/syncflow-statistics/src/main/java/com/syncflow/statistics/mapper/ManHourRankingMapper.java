package com.syncflow.statistics.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.statistics.entity.ManHourRanking;
import org.apache.ibatis.annotations.Mapper;

/**
 * Mapper for man-hour ranking data.
 */
@Mapper
public interface ManHourRankingMapper extends BaseMapper<ManHourRanking> {
}
