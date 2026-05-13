package com.syncflow.statistics.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.admin.entity.User;
import com.syncflow.admin.mapper.UserMapper;
import com.syncflow.project.entity.Project;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.statistics.dto.*;
import com.syncflow.statistics.service.impl.DashboardServiceImpl;
import com.syncflow.task.entity.Task;
import com.syncflow.task.mapper.TaskMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardService")
class DashboardServiceTest {

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private UserMapper userMapper;

    @Mock
    private ProjectMapper projectMapper;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    private Task buildTask(Long id, String title, Integer status, Integer type) {
        Task task = new Task();
        task.setId(id);
        task.setTaskNo("TSK-20260507-" + String.format("%03d", id));
        task.setTitle(title);
        task.setStatus(status);
        task.setType(resolveTypeCode(type));
        task.setProjectId(1L);
        task.setAssigneeId(1L);
        task.setDueDate(LocalDate.now().plusDays(5));
        task.setIsOverdue(false);
        task.setPlannedHours(BigDecimal.valueOf(8));
        return task;
    }

    private String resolveTypeCode(Integer type) {
        if (type == null) return "TASK";
        return switch (type) {
            case 1 -> "TASK";
            case 2 -> "MILESTONE";
            case 3 -> "ISSUE";
            case 4 -> "RISK";
            case 5 -> "ACTIVITY";
            default -> "TASK";
        };
    }

    private User buildUser(Long id, String name) {
        User user = new User();
        user.setId(id);
        user.setRealName(name);
        return user;
    }

    // -----------------------------------------------------------------------
    //  getDashboard
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getDashboard()")
    class GetDashboard {

        @Test
        @DisplayName("should return full dashboard aggregate")
        void shouldReturnFullDashboard() {
            // All sub-queries return empty lists
            when(taskMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());

            DashboardVO result = dashboardService.getDashboard(1L);

            assertNotNull(result);
            assertNotNull(result.getCompletedTasks());
            assertNotNull(result.getOverdueTasks());
            assertNotNull(result.getRisks());
            assertNotNull(result.getCurrentTasks());
            assertNotNull(result.getNextTasks());
            assertNotNull(result.getManHourRanking());
            assertNotNull(result.getOnTimeRateRanking());
            assertNotNull(result.getInProgressActivities());
            verify(taskMapper, atLeastOnce()).selectList(any(LambdaQueryWrapper.class));
        }
    }

    // -----------------------------------------------------------------------
    //  getCompletedTasks
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getCompletedTasks()")
    class GetCompletedTasks {

        @Test
        @DisplayName("should return completed tasks from last 30 days")
        void shouldReturnCompletedTasks() {
            Task task = buildTask(1L, "Completed Task", 4, 1); // completed
            task.setActualEnd(LocalDate.now().minusDays(2));
            when(taskMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(task));
            User user = buildUser(1L, "Assignee");
            when(userMapper.selectBatchIds(anyCollection())).thenReturn(List.of(user));
            Project project = new Project();
            project.setId(1L);
            project.setName("Project 1");
            when(projectMapper.selectBatchIds(anyCollection())).thenReturn(List.of(project));

            List<TaskStatVO> result = dashboardService.getCompletedTasks(1L);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("Completed Task", result.get(0).getTitle());
            assertEquals("Assignee", result.get(0).getAssigneeName());
            assertEquals("Project 1", result.get(0).getProjectName());
        }

        @Test
        @DisplayName("should return empty list when no completed tasks")
        void shouldReturnEmptyList() {
            when(taskMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());

            List<TaskStatVO> result = dashboardService.getCompletedTasks(null);

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  getOverdueTasks
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getOverdueTasks()")
    class GetOverdueTasks {

        @Test
        @DisplayName("should return overdue tasks")
        void shouldReturnOverdueTasks() {
            Task task = buildTask(1L, "Overdue Task", 2, 1); // in_progress, overdue
            task.setIsOverdue(true);
            task.setDueDate(LocalDate.now().minusDays(3));
            when(taskMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(task));
            when(userMapper.selectBatchIds(anyCollection())).thenReturn(Collections.emptyList());
            when(projectMapper.selectBatchIds(anyCollection())).thenReturn(Collections.emptyList());

            List<TaskStatVO> result = dashboardService.getOverdueTasks(1L);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("Overdue Task", result.get(0).getTitle());
            assertNotNull(result.get(0).getDueDate());
        }
    }

    // -----------------------------------------------------------------------
    //  getManHourRanking
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getManHourRanking()")
    class GetManHourRanking {

        @Test
        @DisplayName("should return man-hour ranking with pie data")
        void shouldReturnManHourRanking() {
            Task task = new Task();
            task.setId(1L);
            task.setAssigneeId(1L);
            task.setActualHours(BigDecimal.valueOf(40));
            when(taskMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(task));
            User user = buildUser(1L, "Top Worker");
            when(userMapper.selectById(1L)).thenReturn(user);

            ManHourRankingVO result = dashboardService.getManHourRanking(1L);

            assertNotNull(result);
            assertNotNull(result.getItems());
            assertNotNull(result.getPieData());
            assertEquals(1, result.getItems().size());
            assertEquals("Top Worker", result.getItems().get(0).getUserName());
            assertEquals(1, result.getItems().get(0).getRanking());
            assertEquals(1, result.getPieData().size());
            assertEquals(100, result.getPieData().get(0).getPercent());
        }

        @Test
        @DisplayName("should return empty ranking when no tasks")
        void shouldReturnEmptyRanking() {
            when(taskMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());

            ManHourRankingVO result = dashboardService.getManHourRanking(null);

            assertNotNull(result);
            assertTrue(result.getItems().isEmpty());
            assertTrue(result.getPieData().isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  getOnTimeRateRanking
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getOnTimeRateRanking()")
    class GetOnTimeRateRanking {

        @Test
        @DisplayName("should calculate on-time rate per user")
        void shouldCalculateOnTimeRate() {
            Task onTimeTask = new Task();
            onTimeTask.setId(1L);
            onTimeTask.setAssigneeId(1L);
            onTimeTask.setDueDate(LocalDate.now());
            onTimeTask.setActualEnd(LocalDate.now().minusDays(1));

            Task lateTask = new Task();
            lateTask.setId(2L);
            lateTask.setAssigneeId(1L);
            lateTask.setDueDate(LocalDate.now().minusDays(5));
            lateTask.setActualEnd(LocalDate.now());

            when(taskMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(onTimeTask, lateTask));
            User user = buildUser(1L, "Worker");
            when(userMapper.selectById(1L)).thenReturn(user);

            List<OnTimeRateVO> result = dashboardService.getOnTimeRateRanking(1L);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("Worker", result.get(0).getUserName());
            assertEquals(2, result.get(0).getTotalTasks());
            assertEquals(1, result.get(0).getOnTimeTasks());
            assertTrue(result.get(0).getRate().compareTo(BigDecimal.ZERO) > 0);
        }

        @Test
        @DisplayName("should return empty list when no completed tasks")
        void shouldReturnEmptyList() {
            when(taskMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());

            List<OnTimeRateVO> result = dashboardService.getOnTimeRateRanking(null);

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }
}
