package com.syncflow.config.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.config.entity.OrderCategory;
import org.apache.ibatis.annotations.Mapper;

/**
 * Mapper for cfg_order_category.
 */
@Mapper
public interface OrderCategoryMapper extends BaseMapper<OrderCategory> {
}
