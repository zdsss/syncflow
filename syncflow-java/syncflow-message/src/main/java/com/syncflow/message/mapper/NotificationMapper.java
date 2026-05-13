package com.syncflow.message.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.message.entity.Notification;
import org.apache.ibatis.annotations.Mapper;

/**
 * MyBatis-Plus mapper for the {@code notification} table.
 */
@Mapper
public interface NotificationMapper extends BaseMapper<Notification> {
}
