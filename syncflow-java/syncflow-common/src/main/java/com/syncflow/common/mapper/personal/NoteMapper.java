package com.syncflow.common.mapper.personal;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.common.entity.personal.Note;
import org.apache.ibatis.annotations.Mapper;

/**
 * MyBatis-Plus mapper for {@link Note}.
 */
@Mapper
public interface NoteMapper extends BaseMapper<Note> {
}
