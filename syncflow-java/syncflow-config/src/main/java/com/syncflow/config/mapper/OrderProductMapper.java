package com.syncflow.config.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.config.entity.OrderProduct;
import org.apache.ibatis.annotations.Mapper;

/**
 * Mapper for cfg_order_product.
 */
@Mapper
public interface OrderProductMapper extends BaseMapper<OrderProduct> {
}
