package com.syncflow.file.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.file.entity.FileEntity;
import org.apache.ibatis.annotations.Mapper;

/**
 * File entity mapper.
 */
@Mapper
public interface FileMapper extends BaseMapper<FileEntity> {
}
