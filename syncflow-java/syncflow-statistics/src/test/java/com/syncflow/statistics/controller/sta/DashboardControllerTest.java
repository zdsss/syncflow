package com.syncflow.statistics.controller.sta;

import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.statistics.dto.*;
import com.syncflow.statistics.service.DashboardService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DashboardController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private TaskStatVO buildTaskStatVO() {
        TaskStatVO vo = new TaskStatVO();
        vo.setTaskId(1L);
        vo.setTaskNo("TSK-001");
        vo.setTitle("Design Review");
        vo.setProjectName("Project Alpha");
        vo.setAssigneeName("admin");
        vo.setStatus("completed");
        vo.setDueDate(LocalDate.now().plusDays(7));
        vo.setCompletedAt(LocalDateTime.now());
        vo.setType("TASK");
        vo.setActualHours(new BigDecimal("8.5"));
        vo.setPlannedHours(new BigDecimal("10.0"));
        return vo;
    }

    private RiskStatVO buildRiskStatVO() {
        RiskStatVO vo = new RiskStatVO();
        vo.setTaskId(2L);
        vo.setTitle("Supply Delay");
        vo.setProjectName("Project Alpha");
        vo.setRiskLevel("HIGH");
        vo.setDescription("Supplier shipment delayed by 2 weeks");
        return vo;
    }

    private ManHourRankingVO buildManHourRankingVO() {
        ManHourRankingVO vo = new ManHourRankingVO();
        ManHourRankingItemVO item = new ManHourRankingItemVO();
        item.setUserId(1L);
        item.setUserName("admin");
        item.setHours(new BigDecimal("40.0"));
        item.setRanking(1);
        vo.setItems(Collections.singletonList(item));

        PieChartDataVO pie = new PieChartDataVO();
        pie.setName("admin");
        pie.setValue(new BigDecimal("40.0"));
        pie.setPercent(100);
        vo.setPieData(Collections.singletonList(pie));
        return vo;
    }

    private OnTimeRateVO buildOnTimeRateVO() {
        OnTimeRateVO vo = new OnTimeRateVO();
        vo.setUserId(1L);
        vo.setUserName("admin");
        vo.setTotalTasks(10);
        vo.setOnTimeTasks(8);
        vo.setRate(new BigDecimal("80.0"));
        return vo;
    }

    private DashboardVO buildDashboardVO() {
        DashboardVO vo = new DashboardVO();
        vo.setCompletedTasks(Collections.singletonList(buildTaskStatVO()));
        vo.setOverdueTasks(Collections.emptyList());
        vo.setRisks(Collections.singletonList(buildRiskStatVO()));
        vo.setCurrentTasks(Collections.singletonList(buildTaskStatVO()));
        vo.setNextTasks(Collections.emptyList());
        vo.setManHourRanking(buildManHourRankingVO());
        vo.setOnTimeRateRanking(Collections.singletonList(buildOnTimeRateVO()));
        vo.setInProgressActivities(Collections.singletonList(buildTaskStatVO()));
        return vo;
    }

    // -----------------------------------------------------------------------
    //  GET /api/dashboard
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/dashboard")
    class GetDashboard {

        @Test
        @DisplayName("should return full dashboard aggregate")
        void shouldReturnDashboard() throws Exception {
            when(dashboardService.getDashboard(20L)).thenReturn(buildDashboardVO());

            mockMvc.perform(get("/api/dashboard").param("projectId", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.completedTasks").isArray())
                    .andExpect(jsonPath("$.data.overdueTasks").isArray())
                    .andExpect(jsonPath("$.data.risks").isArray())
                    .andExpect(jsonPath("$.data.currentTasks").isArray())
                    .andExpect(jsonPath("$.data.manHourRanking").isNotEmpty())
                    .andExpect(jsonPath("$.data.onTimeRateRanking").isArray())
                    .andExpect(jsonPath("$.data.inProgressActivities").isArray());
        }

        @Test
        @DisplayName("should return dashboard without projectId")
        void shouldReturnDashboardWithoutProject() throws Exception {
            when(dashboardService.getDashboard(isNull())).thenReturn(buildDashboardVO());

            mockMvc.perform(get("/api/dashboard"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isNotEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/dashboard/completed-tasks
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/dashboard/completed-tasks")
    class GetCompletedTasks {

        @Test
        @DisplayName("should return completed tasks")
        void shouldReturnCompletedTasks() throws Exception {
            when(dashboardService.getCompletedTasks(20L))
                    .thenReturn(Collections.singletonList(buildTaskStatVO()));

            mockMvc.perform(get("/api/dashboard/completed-tasks")
                            .param("projectId", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].taskId").value(1))
                    .andExpect(jsonPath("$.data[0].status").value("completed"));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/dashboard/overdue-tasks
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/dashboard/overdue-tasks")
    class GetOverdueTasks {

        @Test
        @DisplayName("should return overdue tasks")
        void shouldReturnOverdueTasks() throws Exception {
            when(dashboardService.getOverdueTasks(20L))
                    .thenReturn(Collections.singletonList(buildTaskStatVO()));

            mockMvc.perform(get("/api/dashboard/overdue-tasks")
                            .param("projectId", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].taskId").value(1));
        }

        @Test
        @DisplayName("should return empty list when no overdue tasks")
        void shouldReturnEmptyList() throws Exception {
            when(dashboardService.getOverdueTasks(isNull()))
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/dashboard/overdue-tasks"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/dashboard/risks
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/dashboard/risks")
    class GetRisks {

        @Test
        @DisplayName("should return risk tasks")
        void shouldReturnRisks() throws Exception {
            when(dashboardService.getRisks(20L))
                    .thenReturn(Collections.singletonList(buildRiskStatVO()));

            mockMvc.perform(get("/api/dashboard/risks")
                            .param("projectId", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].taskId").value(2))
                    .andExpect(jsonPath("$.data[0].riskLevel").value("HIGH"))
                    .andExpect(jsonPath("$.data[0].title").value("Supply Delay"));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/dashboard/current-tasks
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/dashboard/current-tasks")
    class GetCurrentTasks {

        @Test
        @DisplayName("should return current tasks")
        void shouldReturnCurrentTasks() throws Exception {
            when(dashboardService.getCurrentTasks(20L))
                    .thenReturn(Collections.singletonList(buildTaskStatVO()));

            mockMvc.perform(get("/api/dashboard/current-tasks")
                            .param("projectId", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].taskId").value(1));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/dashboard/next-tasks
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/dashboard/next-tasks")
    class GetNextTasks {

        @Test
        @DisplayName("should return next tasks")
        void shouldReturnNextTasks() throws Exception {
            when(dashboardService.getNextTasks(20L))
                    .thenReturn(Collections.singletonList(buildTaskStatVO()));

            mockMvc.perform(get("/api/dashboard/next-tasks")
                            .param("projectId", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].taskId").value(1));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/dashboard/man-hour-ranking
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/dashboard/man-hour-ranking")
    class GetManHourRanking {

        @Test
        @DisplayName("should return man-hour ranking with pie data")
        void shouldReturnManHourRanking() throws Exception {
            when(dashboardService.getManHourRanking(20L))
                    .thenReturn(buildManHourRankingVO());

            mockMvc.perform(get("/api/dashboard/man-hour-ranking")
                            .param("projectId", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.items").isArray())
                    .andExpect(jsonPath("$.data.items[0].userName").value("admin"))
                    .andExpect(jsonPath("$.data.items[0].ranking").value(1))
                    .andExpect(jsonPath("$.data.pieData").isArray())
                    .andExpect(jsonPath("$.data.pieData[0].name").value("admin"));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/dashboard/on-time-rate-ranking
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/dashboard/on-time-rate-ranking")
    class GetOnTimeRateRanking {

        @Test
        @DisplayName("should return on-time rate ranking")
        void shouldReturnOnTimeRateRanking() throws Exception {
            when(dashboardService.getOnTimeRateRanking(20L))
                    .thenReturn(Collections.singletonList(buildOnTimeRateVO()));

            mockMvc.perform(get("/api/dashboard/on-time-rate-ranking")
                            .param("projectId", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].userId").value(1))
                    .andExpect(jsonPath("$.data[0].userName").value("admin"))
                    .andExpect(jsonPath("$.data[0].totalTasks").value(10))
                    .andExpect(jsonPath("$.data[0].onTimeTasks").value(8))
                    .andExpect(jsonPath("$.data[0].rate").value(80.0));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/dashboard/in-progress-activities
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/dashboard/in-progress-activities")
    class GetInProgressActivities {

        @Test
        @DisplayName("should return in-progress activities")
        void shouldReturnInProgressActivities() throws Exception {
            when(dashboardService.getInProgressActivities(20L))
                    .thenReturn(Collections.singletonList(buildTaskStatVO()));

            mockMvc.perform(get("/api/dashboard/in-progress-activities")
                            .param("projectId", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].taskId").value(1));
        }
    }
}
