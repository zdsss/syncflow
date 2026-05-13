package com.syncflow.message.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.common.result.PageResult;
import com.syncflow.message.dto.NotificationSettingVO;
import com.syncflow.message.dto.NotificationVO;
import com.syncflow.message.entity.Notification;
import com.syncflow.message.entity.NotificationSetting;
import com.syncflow.message.mapper.NotificationMapper;
import com.syncflow.message.mapper.NotificationSettingMapper;
import com.syncflow.message.service.impl.NotificationServiceImpl;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService")
class NotificationServiceTest {

    @Mock
    private NotificationMapper notificationMapper;

    @Mock
    private NotificationSettingMapper notificationSettingMapper;

    @Mock
    private NotificationPushService pushService;

    private NotificationServiceImpl notificationService;

    @BeforeEach
    void setUp() {
        // Initialize MyBatis-Plus lambda cache for entities used in LambdaUpdateWrapper
        MapperBuilderAssistant assistant = new MapperBuilderAssistant(new MybatisConfiguration(), "");
        TableInfoHelper.initTableInfo(assistant, Notification.class);
        TableInfoHelper.initTableInfo(assistant, NotificationSetting.class);

        // Manually construct service (needed for Java 25 where @InjectMocks fails
        // with concrete @Mock dependencies)
        notificationService = new NotificationServiceImpl(
                notificationMapper, notificationSettingMapper, pushService);
    }

    private Notification buildNotification(Long id, Long userId) {
        Notification notification = new Notification();
        notification.setId(id);
        notification.setUserId(userId);
        notification.setType("TASK");
        notification.setTitle("Task reminder");
        notification.setContent("Your task is due");
        notification.setRelatedType("TASK");
        notification.setRelatedId(1L);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        return notification;
    }

    // -----------------------------------------------------------------------
    //  sendNotification
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("sendNotification()")
    class SendNotification {

        @Test
        @DisplayName("should create and push notification")
        void shouldCreateAndPushNotification() {
            when(notificationMapper.insert(any(Notification.class))).thenReturn(1);

            NotificationVO result = notificationService.sendNotification(
                    1L, "TASK", "Task reminder", "Your task is due", "TASK", 1L);

            assertNotNull(result);
            assertEquals("TASK", result.getType());
            assertEquals("Task reminder", result.getTitle());
            assertEquals("Your task is due", result.getContent());
            assertEquals(false, result.getIsRead());
            verify(notificationMapper).insert(any(Notification.class));
            verify(pushService).pushNotification(eq(1L), any(NotificationVO.class));
        }
    }

    // -----------------------------------------------------------------------
    //  getNotifications
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getNotifications()")
    class GetNotifications {

        @Test
        @DisplayName("should return paginated notifications")
        void shouldReturnPaginatedNotifications() {
            Notification notification = buildNotification(1L, 1L);
            Page<Notification> page = new Page<>(1, 10);
            page.setRecords(List.of(notification));
            page.setTotal(1);

            when(notificationMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                    .thenReturn(page);

            PageResult<NotificationVO> result = notificationService.getNotifications(1L, 1, 10);

            assertNotNull(result);
            assertEquals(1, result.getRecords().size());
            assertEquals("Task reminder", result.getRecords().get(0).getTitle());
            assertEquals(1L, result.getTotal());
            verify(notificationMapper).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("should return empty page when no notifications")
        void shouldReturnEmptyPage() {
            Page<Notification> page = new Page<>(1, 10);
            page.setRecords(Collections.emptyList());
            page.setTotal(0);

            when(notificationMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                    .thenReturn(page);

            PageResult<NotificationVO> result = notificationService.getNotifications(1L, 1, 10);

            assertNotNull(result);
            assertTrue(result.getRecords().isEmpty());
            assertEquals(0L, result.getTotal());
        }
    }

    // -----------------------------------------------------------------------
    //  getUnreadCount
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getUnreadCount()")
    class GetUnreadCount {

        @Test
        @DisplayName("should return unread count for user")
        void shouldReturnUnreadCount() {
            when(notificationMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(5L);

            long count = notificationService.getUnreadCount(1L);

            assertEquals(5L, count);
            verify(notificationMapper).selectCount(any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("should return 0 when no unread notifications")
        void shouldReturnZeroWhenNoUnread() {
            when(notificationMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            long count = notificationService.getUnreadCount(1L);

            assertEquals(0L, count);
        }
    }

    // -----------------------------------------------------------------------
    //  markAsRead
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("markAsRead()")
    class MarkAsRead {

        @Test
        @DisplayName("should mark notification as read")
        void shouldMarkAsRead() {
            when(notificationMapper.update(isNull(), any(LambdaUpdateWrapper.class)))
                    .thenReturn(1);

            notificationService.markAsRead(1L, 1L);

            verify(notificationMapper).update(isNull(), any(LambdaUpdateWrapper.class));
        }
    }

    // -----------------------------------------------------------------------
    //  markAllAsRead
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("markAllAsRead()")
    class MarkAllAsRead {

        @Test
        @DisplayName("should mark all notifications as read for user")
        void shouldMarkAllAsRead() {
            when(notificationMapper.update(isNull(), any(LambdaUpdateWrapper.class)))
                    .thenReturn(3);

            notificationService.markAllAsRead(1L);

            verify(notificationMapper).update(isNull(), any(LambdaUpdateWrapper.class));
        }
    }

    // -----------------------------------------------------------------------
    //  getSettings
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getSettings()")
    class GetSettings {

        @Test
        @DisplayName("should return existing settings")
        void shouldReturnExistingSettings() {
            NotificationSetting setting = new NotificationSetting();
            setting.setId(1L);
            setting.setUserId(1L);
            setting.setTaskReminder(true);
            setting.setEmailNotify(true);
            setting.setAppNotify(true);
            setting.setSmsNotify(false);
            setting.setReminderDays(3);

            when(notificationSettingMapper.selectOne(any(LambdaQueryWrapper.class)))
                    .thenReturn(setting);

            NotificationSettingVO result = notificationService.getSettings(1L);

            assertNotNull(result);
            assertTrue(result.getTaskReminder());
            assertTrue(result.getEmailNotify());
            assertTrue(result.getAppNotify());
            assertFalse(result.getSmsNotify());
            assertEquals(3, result.getReminderDays());
        }

        @Test
        @DisplayName("should create default settings when none exist")
        void shouldCreateDefaultSettings() {
            when(notificationSettingMapper.selectOne(any(LambdaQueryWrapper.class)))
                    .thenReturn(null);
            when(notificationSettingMapper.insert(any(NotificationSetting.class))).thenReturn(1);

            NotificationSettingVO result = notificationService.getSettings(1L);

            assertNotNull(result);
            assertTrue(result.getTaskReminder());
            assertTrue(result.getEmailNotify());
            assertTrue(result.getAppNotify());
            assertFalse(result.getSmsNotify());
            assertEquals(3, result.getReminderDays());
            verify(notificationSettingMapper).insert(any(NotificationSetting.class));
        }
    }

    // -----------------------------------------------------------------------
    //  updateSettings
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("updateSettings()")
    class UpdateSettings {

        @Test
        @DisplayName("should update existing settings")
        void shouldUpdateSettings() {
            NotificationSetting existing = new NotificationSetting();
            existing.setId(1L);
            existing.setUserId(1L);
            existing.setTaskReminder(true);
            existing.setEmailNotify(true);
            existing.setAppNotify(true);
            existing.setSmsNotify(false);
            existing.setReminderDays(3);

            when(notificationSettingMapper.selectOne(any(LambdaQueryWrapper.class)))
                    .thenReturn(existing);
            when(notificationSettingMapper.updateById(any(NotificationSetting.class)))
                    .thenReturn(1);

            NotificationSettingVO updates = new NotificationSettingVO();
            updates.setSmsNotify(true);
            updates.setReminderDays(7);

            notificationService.updateSettings(1L, updates);

            assertTrue(existing.getSmsNotify());
            assertEquals(7, existing.getReminderDays());
            // Unchanged fields remain
            assertTrue(existing.getTaskReminder());
            verify(notificationSettingMapper).updateById(existing);
        }
    }
}
