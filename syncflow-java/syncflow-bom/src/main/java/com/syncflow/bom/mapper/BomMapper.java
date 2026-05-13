package com.syncflow.bom.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.bom.entity.Bom;
import org.apache.ibatis.annotations.Mapper;

/**
 * BOM main entity mapper.
 */
@Mapper
public interface BomMapper extends BaseMapper<Bom> {
}
