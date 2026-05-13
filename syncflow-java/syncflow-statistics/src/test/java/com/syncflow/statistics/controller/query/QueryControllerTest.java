package com.syncflow.statistics.controller.query;

import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.statistics.dto.query.*;
import com.syncflow.statistics.service.query.QueryService;
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
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(QueryController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("QueryController")
class QueryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private QueryService queryService;

    // -----------------------------------------------------------------------
    //  GET /api/query/task-stats
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/query/task-stats")
    class GetTaskStatsTests {

        @Test
        @DisplayName("should return task statistics")
        void getTaskStats_success() throws Exception {
            Map<String, Long> byType = new HashMap<>();
            byType.put("TASK", 10L);
            byType.put("ISSUE", 3L);

            TaskStatsVO vo = TaskStatsVO.builder()
                    .totalTasks(50)
                    .completedTasks(20)
                    .overdueTasks(5)
                    .inProgressTasks(15)
                    .pendingTasks(10)
                    .byType(byType)
                    .byPriority(Collections.emptyMap())
                    .build();
            when(queryService.getTaskStats(1L)).thenReturn(vo);

            mockMvc.perform(get("/api/query/task-stats")
                            .param("projectId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.totalTasks").value(50))
                    .andExpect(jsonPath("$.data.completedTasks").value(20))
                    .andExpect(jsonPath("$.data.overdueTasks").value(5));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/query/project-stats
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/query/project-stats")
    class GetProjectStatsTests {

        @Test
        @DisplayName("should return project statistics")
        void getProjectStats_success() throws Exception {
            ProjectStatsVO vo = ProjectStatsVO.builder()
                    .totalProjects(10)
                    .activeProjects(5)
                    .completedProjects(3)
                    .delayedProjects(2)
                    .byType(Collections.emptyMap())
                    .byDepartment(Collections.emptyMap())
                    .build();
            when(queryService.getProjectStats()).thenReturn(vo);

            mockMvc.perform(get("/api/query/project-stats"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.totalProjects").value(10))
                    .andExpect(jsonPath("$.data.activeProjects").value(5));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/query/overdue-tasks
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/query/overdue-tasks")
    class GetOverdueTasksTests {

        @Test
        @DisplayName("should return overdue tasks list")
        void getOverdueTasks_success() throws Exception {
            OverdueTaskVO task = OverdueTaskVO.builder()
                    .taskId(1L)
                    .taskNo("TSK-001")
                    .title("Overdue Task")
                    .projectName("Project Alpha")
                    .dueDate(LocalDate.of(2026, 4, 1))
                    .status(2)
                    .progress(30)
                    .build();
            when(queryService.getOverdueTasks(1L)).thenReturn(List.of(task));

            mockMvc.perform(get("/api/query/overdue-tasks")
                            .param("projectId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].taskId").value(1))
                    .andExpect(jsonPath("$.data[0].title").value("Overdue Task"));
        }

        @Test
        @DisplayName("should return empty list when no overdue tasks")
        void getOverdueTasks_empty() throws Exception {
            when(queryService.getOverdueTasks(isNull())).thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/query/overdue-tasks"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/query/project-progress/{projectId}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/query/project-progress/{projectId}")
    class GetProjectProgressTests {

        @Test
        @DisplayName("should return project progress")
        void getProjectProgress_success() throws Exception {
            ProjectProgressVO vo = ProjectProgressVO.builder()
                    .projectId(1L)
                    .projectName("Project Alpha")
                    .progress(65)
                    .totalTasks(20)
                    .completedTasks(13)
                    .overdueTasks(2)
                    .plannedHours(new BigDecimal("200.0"))
                    .actualHours(new BigDecimal("150.0"))
                    .build();
            when(queryService.getProjectProgress(1L)).thenReturn(vo);

            mockMvc.perform(get("/api/query/project-progress/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.projectId").value(1))
                    .andExpect(jsonPath("$.data.progress").value(65))
                    .andExpect(jsonPath("$.data.totalTasks").value(20))
                    .andExpect(jsonPath("$.data.completedTasks").value(13));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/query/user-workload/{userId}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/query/user-workload/{userId}")
    class GetUserWorkloadTests {

        @Test
        @DisplayName("should return user workload")
        void getUserWorkload_success() throws Exception {
            UserWorkloadVO vo = UserWorkloadVO.builder()
                    .userId(1L)
                    .userName("admin")
                    .totalTasks(15)
                    .completedTasks(10)
                    .inProgressTasks(3)
                    .overdueTasks(2)
                    .totalHours(new BigDecimal("120.0"))
                    .actualHours(new BigDecimal("80.0"))
                    .build();
            when(queryService.getUserWorkload(1L)).thenReturn(vo);

            mockMvc.perform(get("/api/query/user-workload/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.userId").value(1))
                    .andExpect(jsonPath("$.data.totalTasks").value(15))
                    .andExpect(jsonPath("$.data.completedTasks").value(10));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/query/department-stats/{departmentId}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/query/department-stats/{departmentId}")
    class GetDepartmentStatsTests {

        @Test
        @DisplayName("should return department statistics")
        void getDepartmentStats_success() throws Exception {
            DepartmentStatsVO vo = DepartmentStatsVO.builder()
                    .departmentId(1L)
                    .departmentName("Engineering")
                    .totalMembers(10)
                    .totalTasks(50)
                    .completedTasks(30)
                    .overdueTasks(5)
                    .members(Collections.emptyList())
                    .build();
            when(queryService.getDepartmentStats(1L)).thenReturn(vo);

            mockMvc.perform(get("/api/query/department-stats/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.departmentId").value(1))
                    .andExpect(jsonPath("$.data.totalMembers").value(10));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/query/export/tasks
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/query/export/tasks")
    class ExportTasksTests {

        @Test
        @DisplayName("should export tasks as CSV")
        void exportTasks_success() throws Exception {
            String csv = "ID,TaskNo,Title\n1,TSK-001,Task 1\n";
            when(queryService.exportTasks(1L)).thenReturn(csv);

            mockMvc.perform(get("/api/query/export/tasks")
                            .param("projectId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Disposition", "attachment; filename=tasks.csv"));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/query/export/projects
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/query/export/projects")
    class ExportProjectsTests {

        @Test
        @DisplayName("should export projects as CSV")
        void exportProjects_success() throws Exception {
            String csv = "ID,Name,Code\n1,Project Alpha,PA\n";
            when(queryService.exportProjects()).thenReturn(csv);

            mockMvc.perform(get("/api/query/export/projects"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Disposition", "attachment; filename=projects.csv"));
        }
    }
}
