package com.syncflow.message.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.common.result.PageResult;
import com.syncflow.message.dto.NotificationSettingVO;
import com.syncflow.message.dto.NotificationVO;
import com.syncflow.message.entity.Notification;
import com.syncflow.message.entity.NotificationSetting;
import com.syncflow.message.mapper.NotificationMapper;
import com.syncflow.message.mapper.NotificationSettingMapper;
import com.syncflow.message.service.NotificationPushService;
import com.syncflow.message.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Notification management service implementation.
 */
@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationMapper notificationMapper;
    private final NotificationSettingMapper notificationSettingMapper;
    private final NotificationPushService pushService;

    public NotificationServiceImpl(NotificationMapper notificationMapper,
                                   NotificationSettingMapper notificationSettingMapper,
                                   NotificationPushService pushService) {
        this.notificationMapper = notificationMapper;
        this.notificationSettingMapper = notificationSettingMapper;
        this.pushService = pushService;
    }

    // -----------------------------------------------------------------------
    //  Send
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public NotificationVO sendNotification(Long userId, String type, String title,
                                           String content, String relatedType, Long relatedId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setRelatedType(relatedType);
        notification.setRelatedId(relatedId);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        notificationMapper.insert(notification);

        NotificationVO vo = toVO(notification);

        // Push via STOMP if user is connected
        pushService.pushNotification(userId, vo);

        return vo;
    }

    // -----------------------------------------------------------------------
    //  List & Count
    // -----------------------------------------------------------------------

    @Override
    public PageResult<NotificationVO> getNotifications(Long userId, int pageNum, int pageSize) {
        Page<Notification> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Notification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Notification::getUserId, userId)
               .orderByDesc(Notification::getCreatedAt);

        Page<Notification> result = notificationMapper.selectPage(page, wrapper);

        List<NotificationVO> records = result.getRecords().stream()
                .map(this::toVO)
                .collect(Collectors.toList());

        return new PageResult<>(records, result.getTotal(), result.getSize(), result.getCurrent());
    }

    @Override
    public long getUnreadCount(Long userId) {
        LambdaQueryWrapper<Notification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Notification::getUserId, userId)
               .eq(Notification::getIsRead, false);
        return notificationMapper.selectCount(wrapper);
    }

    // -----------------------------------------------------------------------
    //  Mark as Read
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        LambdaUpdateWrapper<Notification> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(Notification::getId, notificationId)
               .eq(Notification::getUserId, userId)
               .eq(Notification::getIsRead, false)
               .set(Notification::getIsRead, true)
               .set(Notification::getReadAt, LocalDateTime.now());
        notificationMapper.update(null, wrapper);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        LambdaUpdateWrapper<Notification> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(Notification::getUserId, userId)
               .eq(Notification::getIsRead, false)
               .set(Notification::getIsRead, true)
               .set(Notification::getReadAt, LocalDateTime.now());
        notificationMapper.update(null, wrapper);
    }

    // -----------------------------------------------------------------------
    //  Settings
    // -----------------------------------------------------------------------

    @Override
    public NotificationSettingVO getSettings(Long userId) {
        NotificationSetting setting = getOrCreateSettings(userId);
        return toSettingVO(setting);
    }

    @Override
    @Transactional
    public void updateSettings(Long userId, NotificationSettingVO settings) {
        NotificationSetting setting = getOrCreateSettings(userId);

        if (settings.getTaskReminder() != null) {
            setting.setTaskReminder(settings.getTaskReminder());
        }
        if (settings.getEmailNotify() != null) {
            setting.setEmailNotify(settings.getEmailNotify());
        }
        if (settings.getAppNotify() != null) {
            setting.setAppNotify(settings.getAppNotify());
        }
        if (settings.getSmsNotify() != null) {
            setting.setSmsNotify(settings.getSmsNotify());
        }
        if (settings.getReminderDays() != null) {
            setting.setReminderDays(settings.getReminderDays());
        }

        notificationSettingMapper.updateById(setting);
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    /**
     * Get existing settings for the user, or create default ones if none exist.
     */
    private NotificationSetting getOrCreateSettings(Long userId) {
        LambdaQueryWrapper<NotificationSetting> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(NotificationSetting::getUserId, userId);
        NotificationSetting setting = notificationSettingMapper.selectOne(wrapper);

        if (setting == null) {
            setting = new NotificationSetting();
            setting.setUserId(userId);
            setting.setTaskReminder(true);
            setting.setEmailNotify(true);
            setting.setAppNotify(true);
            setting.setSmsNotify(false);
            setting.setReminderDays(3);
            notificationSettingMapper.insert(setting);
        }

        return setting;
    }

    /**
     * Convert Notification entity to NotificationVO.
     */
    private NotificationVO toVO(Notification notification) {
        NotificationVO vo = new NotificationVO();
        vo.setId(notification.getId());
        vo.setType(notification.getType());
        vo.setTitle(notification.getTitle());
        vo.setContent(notification.getContent());
        vo.setRelatedType(notification.getRelatedType());
        vo.setRelatedId(notification.getRelatedId());
        vo.setIsRead(notification.getIsRead());
        vo.setCreatedAt(notification.getCreatedAt());
        vo.setReadAt(notification.getReadAt());
        return vo;
    }

    /**
     * Convert NotificationSetting entity to NotificationSettingVO.
     */
    private NotificationSettingVO toSettingVO(NotificationSetting setting) {
        NotificationSettingVO vo = new NotificationSettingVO();
        vo.setTaskReminder(setting.getTaskReminder());
        vo.setEmailNotify(setting.getEmailNotify());
        vo.setAppNotify(setting.getAppNotify());
        vo.setSmsNotify(setting.getSmsNotify());
        vo.setReminderDays(setting.getReminderDays());
        return vo;
    }
}
