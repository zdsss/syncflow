package com.syncflow.bom.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.bom.entity.BomVersion;
import org.apache.ibatis.annotations.Mapper;

/**
 * BOM version history mapper.
 */
@Mapper
public interface BomVersionMapper extends BaseMapper<BomVersion> {
}
