package com.syncflow.message.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.message.dto.NotificationSettingVO;
import com.syncflow.message.dto.NotificationVO;
import com.syncflow.message.service.NotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("NotificationController")
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        SecurityUtils.setCurrentUser(1L, "admin");
    }

    @AfterEach
    void tearDown() {
        SecurityUtils.clear();
    }

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private NotificationVO buildNotificationVO() {
        NotificationVO vo = new NotificationVO();
        vo.setId(1L);
        vo.setType("TASK");
        vo.setTitle("Task Reminder");
        vo.setContent("Task TSK-001 is due tomorrow");
        vo.setRelatedType("TASK");
        vo.setRelatedId(10L);
        vo.setIsRead(false);
        vo.setCreatedAt(LocalDateTime.now());
        return vo;
    }

    private NotificationSettingVO buildNotificationSettingVO() {
        NotificationSettingVO vo = new NotificationSettingVO();
        vo.setTaskReminder(true);
        vo.setEmailNotify(false);
        vo.setAppNotify(true);
        vo.setSmsNotify(false);
        vo.setReminderDays(3);
        return vo;
    }

    // -----------------------------------------------------------------------
    //  GET /api/notifications
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/notifications")
    class GetNotifications {

        @Test
        @DisplayName("should return paginated notifications")
        void shouldReturnNotifications() throws Exception {
            PageResult<NotificationVO> pageResult = new PageResult<>(
                    Collections.singletonList(buildNotificationVO()),
                    1L, 10, 1);

            when(notificationService.getNotifications(1L, 1, 10))
                    .thenReturn(pageResult);

            mockMvc.perform(get("/api/notifications")
                            .param("pageNum", "1")
                            .param("pageSize", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.records").isArray())
                    .andExpect(jsonPath("$.data.records[0].id").value(1))
                    .andExpect(jsonPath("$.data.records[0].type").value("TASK"))
                    .andExpect(jsonPath("$.data.records[0].title").value("Task Reminder"))
                    .andExpect(jsonPath("$.data.total").value(1))
                    .andExpect(jsonPath("$.data.size").value(10))
                    .andExpect(jsonPath("$.data.current").value(1));
        }

        @Test
        @DisplayName("should use default pagination when params omitted")
        void shouldUseDefaultPagination() throws Exception {
            PageResult<NotificationVO> pageResult = PageResult.empty();
            when(notificationService.getNotifications(1L, 1, 10))
                    .thenReturn(pageResult);

            mockMvc.perform(get("/api/notifications"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.records").isArray())
                    .andExpect(jsonPath("$.data.total").value(0));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/notifications/unread-count
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/notifications/unread-count")
    class GetUnreadCount {

        @Test
        @DisplayName("should return unread count")
        void shouldReturnUnreadCount() throws Exception {
            when(notificationService.getUnreadCount(1L)).thenReturn(5L);

            mockMvc.perform(get("/api/notifications/unread-count"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").value(5));
        }

        @Test
        @DisplayName("should return zero when no unread notifications")
        void shouldReturnZero() throws Exception {
            when(notificationService.getUnreadCount(1L)).thenReturn(0L);

            mockMvc.perform(get("/api/notifications/unread-count"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").value(0));
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/notifications/{id}/read
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PATCH /api/notifications/{id}/read")
    class MarkAsRead {

        @Test
        @DisplayName("should mark a notification as read")
        void shouldMarkAsRead() throws Exception {
            mockMvc.perform(patch("/api/notifications/1/read"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(notificationService).markAsRead(1L, 1L);
        }

        @Test
        @DisplayName("should return error when notification not found")
        void shouldReturnErrorWhenNotFound() throws Exception {
            doThrow(new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND))
                    .when(notificationService).markAsRead(999L, 1L);

            mockMvc.perform(patch("/api/notifications/999/read"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(80101));
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/notifications/read-all
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PATCH /api/notifications/read-all")
    class MarkAllAsRead {

        @Test
        @DisplayName("should mark all notifications as read")
        void shouldMarkAllAsRead() throws Exception {
            mockMvc.perform(patch("/api/notifications/read-all"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(notificationService).markAllAsRead(1L);
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/notifications/settings
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/notifications/settings")
    class GetSettings {

        @Test
        @DisplayName("should return notification settings")
        void shouldReturnSettings() throws Exception {
            when(notificationService.getSettings(1L))
                    .thenReturn(buildNotificationSettingVO());

            mockMvc.perform(get("/api/notifications/settings"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.taskReminder").value(true))
                    .andExpect(jsonPath("$.data.emailNotify").value(false))
                    .andExpect(jsonPath("$.data.appNotify").value(true))
                    .andExpect(jsonPath("$.data.smsNotify").value(false))
                    .andExpect(jsonPath("$.data.reminderDays").value(3));
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/notifications/settings
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/notifications/settings")
    class UpdateSettings {

        @Test
        @DisplayName("should update notification settings")
        void shouldUpdateSettings() throws Exception {
            NotificationSettingVO settings = buildNotificationSettingVO();
            settings.setEmailNotify(true);

            mockMvc.perform(put("/api/notifications/settings")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(settings)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(notificationService).updateSettings(eq(1L), any(NotificationSettingVO.class));
        }
    }
}
