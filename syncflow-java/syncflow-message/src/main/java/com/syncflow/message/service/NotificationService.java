package com.syncflow.message.service;

import com.syncflow.common.result.PageResult;
import com.syncflow.message.dto.NotificationSettingVO;
import com.syncflow.message.dto.NotificationVO;

/**
 * Notification management service interface.
 */
public interface NotificationService {

    /**
     * Create a notification and push it to the user via WebSocket if connected.
     *
     * @param userId      target user id
     * @param type        notification type (TASK, APPROVAL, SYSTEM, etc.)
     * @param title       notification title
     * @param content     notification body
     * @param relatedType type of related entity
     * @param relatedId   id of related entity
     * @return the created notification as a VO
     */
    NotificationVO sendNotification(Long userId, String type, String title,
                                    String content, String relatedType, Long relatedId);

    /**
     * Paginated list of notifications for a user, ordered by creation time desc.
     *
     * @param userId   target user id
     * @param pageNum  page number (1-based)
     * @param pageSize page size
     * @return paginated notifications
     */
    PageResult<NotificationVO> getNotifications(Long userId, int pageNum, int pageSize);

    /**
     * Count unread notifications for a user.
     *
     * @param userId target user id
     * @return unread count
     */
    long getUnreadCount(Long userId);

    /**
     * Mark a single notification as read.
     *
     * @param notificationId notification id
     * @param userId         owner user id (for authorization check)
     */
    void markAsRead(Long notificationId, Long userId);

    /**
     * Mark all unread notifications as read for a user.
     *
     * @param userId target user id
     */
    void markAllAsRead(Long userId);

    /**
     * Get notification settings for a user.
     * <p>
     * Creates default settings if none exist yet.
     *
     * @param userId target user id
     * @return current settings
     */
    NotificationSettingVO getSettings(Long userId);

    /**
     * Update notification settings for a user.
     *
     * @param userId   target user id
     * @param settings new settings values (null fields are ignored)
     */
    void updateSettings(Long userId, NotificationSettingVO settings);
}
