package com.syncflow.bom.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.bom.entity.BomItem;
import org.apache.ibatis.annotations.Mapper;

/**
 * BOM item mapper (tree structure).
 */
@Mapper
public interface BomItemMapper extends BaseMapper<BomItem> {
}
