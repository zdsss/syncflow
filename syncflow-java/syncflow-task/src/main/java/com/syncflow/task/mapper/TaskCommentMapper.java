package com.syncflow.task.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.task.entity.TaskComment;
import org.apache.ibatis.annotations.Mapper;

/**
 * Task comment mapper.
 */
@Mapper
public interface TaskCommentMapper extends BaseMapper<TaskComment> {
}
