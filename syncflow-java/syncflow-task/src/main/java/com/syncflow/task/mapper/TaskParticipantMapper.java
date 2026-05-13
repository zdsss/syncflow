package com.syncflow.task.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.task.entity.TaskParticipant;
import org.apache.ibatis.annotations.Mapper;

/**
 * Task participant mapper.
 */
@Mapper
public interface TaskParticipantMapper extends BaseMapper<TaskParticipant> {
}
