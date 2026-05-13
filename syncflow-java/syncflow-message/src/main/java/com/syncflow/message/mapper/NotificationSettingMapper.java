package com.syncflow.message.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.syncflow.message.entity.NotificationSetting;
import org.apache.ibatis.annotations.Mapper;

/**
 * MyBatis-Plus mapper for the {@code notification_setting} table.
 */
@Mapper
public interface NotificationSettingMapper extends BaseMapper<NotificationSetting> {
}
