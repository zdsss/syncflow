package com.syncflow.message.controller;

import com.syncflow.common.result.PageResult;
import com.syncflow.common.result.Result;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.message.dto.NotificationSettingVO;
import com.syncflow.message.dto.NotificationVO;
import com.syncflow.message.service.NotificationService;
import org.springframework.web.bind.annotation.*;

/**
 * Notification management controller.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Paginated notification list for the current user.
     */
    @GetMapping
    public Result<PageResult<NotificationVO>> getNotifications(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        Long userId = SecurityUtils.getUserId();
        PageResult<NotificationVO> result = notificationService.getNotifications(userId, pageNum, pageSize);
        return Result.success(result);
    }

    /**
     * Count of unread notifications for the current user.
     */
    @GetMapping("/unread-count")
    public Result<Long> getUnreadCount() {
        Long userId = SecurityUtils.getUserId();
        long count = notificationService.getUnreadCount(userId);
        return Result.success(count);
    }

    /**
     * Mark a single notification as read.
     */
    @PatchMapping("/{id}/read")
    public Result<Void> markAsRead(@PathVariable Long id) {
        Long userId = SecurityUtils.getUserId();
        notificationService.markAsRead(id, userId);
        return Result.success();
    }

    /**
     * Mark all notifications as read for the current user.
     */
    @PatchMapping("/read-all")
    public Result<Void> markAllAsRead() {
        Long userId = SecurityUtils.getUserId();
        notificationService.markAllAsRead(userId);
        return Result.success();
    }

    /**
     * Get notification settings for the current user.
     */
    @GetMapping("/settings")
    public Result<NotificationSettingVO> getSettings() {
        Long userId = SecurityUtils.getUserId();
        NotificationSettingVO settings = notificationService.getSettings(userId);
        return Result.success(settings);
    }

    /**
     * Update notification settings for the current user.
     */
    @PutMapping("/settings")
    public Result<Void> updateSettings(@RequestBody NotificationSettingVO settings) {
        Long userId = SecurityUtils.getUserId();
        notificationService.updateSettings(userId, settings);
        return Result.success();
    }
}
