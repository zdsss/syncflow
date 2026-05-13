package com.syncflow.file.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.file.entity.FileVersion;
import org.apache.ibatis.annotations.Mapper;

/**
 * File version history mapper.
 */
@Mapper
public interface FileVersionMapper extends BaseMapper<FileVersion> {
}
