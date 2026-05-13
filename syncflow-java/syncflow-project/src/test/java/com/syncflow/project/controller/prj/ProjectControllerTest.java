package com.syncflow.project.controller.prj;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.project.dto.*;
import com.syncflow.project.service.PhaseService;
import com.syncflow.project.service.ProjectService;
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

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProjectController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("ProjectController")
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProjectService projectService;

    @MockBean
    private PhaseService phaseService;

    @MockBean
    private com.syncflow.project.service.MilestoneService milestoneService;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private ProjectVO buildProjectVO(Long id) {
        ProjectVO vo = new ProjectVO();
        vo.setId(id);
        vo.setName("Project " + id);
        vo.setCode("PRJ-" + id);
        vo.setDescription("Description " + id);
        vo.setOwnerId(1L);
        vo.setOwnerName("Admin");
        vo.setProjectType("R&D");
        vo.setStatus(1);
        vo.setPriority(3);
        vo.setProgress(0);
        vo.setPlannedStart(LocalDate.of(2026, 1, 1));
        vo.setPlannedEnd(LocalDate.of(2026, 12, 31));
        return vo;
    }

    private CreateProjectDTO buildCreateProjectDTO() {
        CreateProjectDTO dto = new CreateProjectDTO();
        dto.setName("New Project");
        dto.setCode("PRJ-NEW");
        dto.setDescription("A new project");
        dto.setOwnerId(1L);
        dto.setProjectType("R&D");
        dto.setPlannedStart(LocalDate.of(2026, 1, 1));
        dto.setPlannedEnd(LocalDate.of(2026, 12, 31));
        return dto;
    }

    private PhaseTreeVO buildPhaseTreeVO(Long id) {
        PhaseTreeVO vo = new PhaseTreeVO();
        vo.setId(id);
        vo.setProjectId(1L);
        vo.setName("Phase " + id);
        vo.setCode("PH-" + id);
        vo.setSeqNo(id.intValue());
        vo.setStatus(1);
        vo.setProgress(0);
        return vo;
    }

    private GanttChartVO buildGanttChartVO() {
        GanttChartVO vo = new GanttChartVO();
        vo.setStartDate(LocalDate.of(2026, 1, 1));
        vo.setEndDate(LocalDate.of(2026, 12, 31));
        vo.setTasks(List.of());
        return vo;
    }

    private ProjectMemberVO buildProjectMemberVO(Long userId) {
        ProjectMemberVO vo = new ProjectMemberVO();
        vo.setId(1L);
        vo.setUserId(userId);
        vo.setUserName("User " + userId);
        vo.setProjectRole("ENGINEER");
        vo.setDeptId(1L);
        vo.setDeptName("Engineering");
        return vo;
    }

    // -----------------------------------------------------------------------
    //  GET /api/projects
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/projects")
    class GetProjectTreeTests {

        @Test
        @DisplayName("should return project tree")
        void getProjectTree_success() throws Exception {
            ProjectVO root = buildProjectVO(1L);
            ProjectVO child = buildProjectVO(2L);
            root.setChildren(List.of(child));

            when(projectService.getProjectTree()).thenReturn(List.of(root));

            mockMvc.perform(get("/api/projects"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data.length()").value(1))
                    .andExpect(jsonPath("$.data[0].name").value("Project 1"))
                    .andExpect(jsonPath("$.data[0].children[0].name").value("Project 2"));

            verify(projectService).getProjectTree();
        }

        @Test
        @DisplayName("should return empty list when no projects")
        void getProjectTree_empty() throws Exception {
            when(projectService.getProjectTree()).thenReturn(List.of());

            mockMvc.perform(get("/api/projects"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/projects/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/projects/{id}")
    class GetProjectDetailTests {

        @Test
        @DisplayName("should return project detail")
        void getProjectDetail_success() throws Exception {
            when(projectService.getProjectDetail(1L)).thenReturn(buildProjectVO(1L));

            mockMvc.perform(get("/api/projects/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.name").value("Project 1"))
                    .andExpect(jsonPath("$.data.code").value("PRJ-1"))
                    .andExpect(jsonPath("$.data.ownerName").value("Admin"));

            verify(projectService).getProjectDetail(1L);
        }

        @Test
        @DisplayName("should return error when project not found")
        void getProjectDetail_notFound() throws Exception {
            when(projectService.getProjectDetail(99L))
                    .thenThrow(new BusinessException(ErrorCode.PROJECT_NOT_FOUND));

            mockMvc.perform(get("/api/projects/99"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.PROJECT_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/projects
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/projects")
    class CreateProjectTests {

        @Test
        @DisplayName("should create project successfully")
        void createProject_success() throws Exception {
            CreateProjectDTO dto = buildCreateProjectDTO();
            ProjectVO result = buildProjectVO(1L);
            when(projectService.createProject(any(CreateProjectDTO.class))).thenReturn(result);

            mockMvc.perform(post("/api/projects")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1));

            verify(projectService).createProject(any(CreateProjectDTO.class));
        }

        @Test
        @DisplayName("should return error when project code already exists")
        void createProject_duplicateCode() throws Exception {
            CreateProjectDTO dto = buildCreateProjectDTO();
            when(projectService.createProject(any(CreateProjectDTO.class)))
                    .thenThrow(new BusinessException(ErrorCode.PROJECT_CODE_EXISTS));

            mockMvc.perform(post("/api/projects")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.PROJECT_CODE_EXISTS.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/projects/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/projects/{id}")
    class UpdateProjectTests {

        @Test
        @DisplayName("should update project successfully")
        void updateProject_success() throws Exception {
            CreateProjectDTO dto = buildCreateProjectDTO();
            ProjectVO result = buildProjectVO(1L);
            when(projectService.updateProject(eq(1L), any(CreateProjectDTO.class))).thenReturn(result);

            mockMvc.perform(put("/api/projects/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1));

            verify(projectService).updateProject(eq(1L), any(CreateProjectDTO.class));
        }

        @Test
        @DisplayName("should return error when project not found")
        void updateProject_notFound() throws Exception {
            CreateProjectDTO dto = buildCreateProjectDTO();
            when(projectService.updateProject(eq(99L), any(CreateProjectDTO.class)))
                    .thenThrow(new BusinessException(ErrorCode.PROJECT_NOT_FOUND));

            mockMvc.perform(put("/api/projects/99")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.PROJECT_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  DELETE /api/projects/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/projects/{id}")
    class DeleteProjectTests {

        @Test
        @DisplayName("should delete project successfully")
        void deleteProject_success() throws Exception {
            doNothing().when(projectService).deleteProject(1L);

            mockMvc.perform(delete("/api/projects/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(projectService).deleteProject(1L);
        }

        @Test
        @DisplayName("should return error when project has children")
        void deleteProject_hasChildren() throws Exception {
            doThrow(new BusinessException(ErrorCode.PROJECT_HAS_CHILDREN))
                    .when(projectService).deleteProject(1L);

            mockMvc.perform(delete("/api/projects/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.PROJECT_HAS_CHILDREN.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/projects/{id}/phases/tree
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/projects/{id}/phases/tree")
    class GetPhaseTreeTests {

        @Test
        @DisplayName("should return phase tree")
        void getPhaseTree_success() throws Exception {
            PhaseTreeVO phase = buildPhaseTreeVO(1L);
            when(projectService.getPhaseTree(1L)).thenReturn(List.of(phase));

            mockMvc.perform(get("/api/projects/1/phases/tree"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].name").value("Phase 1"));

            verify(projectService).getPhaseTree(1L);
        }

        @Test
        @DisplayName("should return error when project not found")
        void getPhaseTree_projectNotFound() throws Exception {
            when(projectService.getPhaseTree(99L))
                    .thenThrow(new BusinessException(ErrorCode.PROJECT_NOT_FOUND));

            mockMvc.perform(get("/api/projects/99/phases/tree"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.PROJECT_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/projects/{id}/gantt
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/projects/{id}/gantt")
    class GetGanttDataTests {

        @Test
        @DisplayName("should return gantt chart data")
        void getGanttData_success() throws Exception {
            GanttChartVO gantt = buildGanttChartVO();
            when(projectService.getGanttData(1L)).thenReturn(gantt);

            mockMvc.perform(get("/api/projects/1/gantt"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.startDate").value("2026-01-01"))
                    .andExpect(jsonPath("$.data.endDate").value("2026-12-31"));

            verify(projectService).getGanttData(1L);
        }

        @Test
        @DisplayName("should return error when project not found")
        void getGanttData_notFound() throws Exception {
            when(projectService.getGanttData(99L))
                    .thenThrow(new BusinessException(ErrorCode.PROJECT_NOT_FOUND));

            mockMvc.perform(get("/api/projects/99/gantt"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.PROJECT_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/projects/{id}/members
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/projects/{id}/members")
    class GetMembersTests {

        @Test
        @DisplayName("should return project members")
        void getMembers_success() throws Exception {
            ProjectMemberVO member = buildProjectMemberVO(1L);
            when(projectService.getMembers(1L)).thenReturn(List.of(member));

            mockMvc.perform(get("/api/projects/1/members"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].projectRole").value("ENGINEER"))
                    .andExpect(jsonPath("$.data[0].userName").value("User 1"));

            verify(projectService).getMembers(1L);
        }

        @Test
        @DisplayName("should return error when project not found")
        void getMembers_notFound() throws Exception {
            when(projectService.getMembers(99L))
                    .thenThrow(new BusinessException(ErrorCode.PROJECT_NOT_FOUND));

            mockMvc.perform(get("/api/projects/99/members"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.PROJECT_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/projects/{id}/members
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/projects/{id}/members")
    class AddMemberTests {

        @Test
        @DisplayName("should add member to project")
        void addMember_success() throws Exception {
            doNothing().when(projectService).addMember(1L, 2L, "ENGINEER", 1L);

            Map<String, Object> body = Map.of(
                    "userId", 2,
                    "projectRole", "ENGINEER",
                    "deptId", 1
            );

            mockMvc.perform(post("/api/projects/1/members")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(projectService).addMember(1L, 2L, "ENGINEER", 1L);
        }

        @Test
        @DisplayName("should return error when member already exists")
        void addMember_alreadyExists() throws Exception {
            doThrow(new BusinessException(ErrorCode.MEMBER_ALREADY_EXISTS))
                    .when(projectService).addMember(eq(1L), eq(2L), any(), any());

            Map<String, Object> body = Map.of(
                    "userId", 2,
                    "projectRole", "ENGINEER"
            );

            mockMvc.perform(post("/api/projects/1/members")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.MEMBER_ALREADY_EXISTS.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  DELETE /api/projects/{id}/members/{userId}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/projects/{id}/members/{userId}")
    class RemoveMemberTests {

        @Test
        @DisplayName("should remove member from project")
        void removeMember_success() throws Exception {
            doNothing().when(projectService).removeMember(1L, 2L);

            mockMvc.perform(delete("/api/projects/1/members/2"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(projectService).removeMember(1L, 2L);
        }

        @Test
        @DisplayName("should return error when project not found")
        void removeMember_projectNotFound() throws Exception {
            doThrow(new BusinessException(ErrorCode.PROJECT_NOT_FOUND))
                    .when(projectService).removeMember(99L, 2L);

            mockMvc.perform(delete("/api/projects/99/members/2"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.PROJECT_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  Helpers — Milestone
    // -----------------------------------------------------------------------

    private MilestoneVO buildMilestoneVO(Long id) {
        MilestoneVO vo = new MilestoneVO();
        vo.setId(id);
        vo.setProjectId(1L);
        vo.setName("Milestone " + id);
        vo.setType("MILESTONE");
        vo.setStatus(1);
        vo.setProgress(0);
        vo.setPlannedDate(LocalDate.of(2026, 6, 1));
        vo.setDeliverable("Description " + id);
        return vo;
    }

    private CreateMilestoneDTO buildCreateMilestoneDTO() {
        CreateMilestoneDTO dto = new CreateMilestoneDTO();
        dto.setName("New Milestone");
        dto.setType("MILESTONE");
        dto.setDueDate(LocalDate.of(2026, 6, 1));
        dto.setDescription("A new milestone");
        return dto;
    }

    // -----------------------------------------------------------------------
    //  POST /api/projects/{id}/milestones
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/projects/{id}/milestones")
    class CreateMilestoneTests {

        @Test
        @DisplayName("should create milestone for a project")
        void createMilestone_success() throws Exception {
            CreateMilestoneDTO dto = buildCreateMilestoneDTO();
            MilestoneVO result = buildMilestoneVO(1L);
            when(milestoneService.createMilestone(eq(1L), any(CreateMilestoneDTO.class)))
                    .thenReturn(result);

            mockMvc.perform(post("/api/projects/1/milestones")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.name").value("Milestone 1"))
                    .andExpect(jsonPath("$.data.type").value("MILESTONE"));

            verify(milestoneService).createMilestone(eq(1L), any(CreateMilestoneDTO.class));
        }

        @Test
        @DisplayName("should return error when project not found")
        void createMilestone_projectNotFound() throws Exception {
            CreateMilestoneDTO dto = buildCreateMilestoneDTO();
            when(milestoneService.createMilestone(eq(99L), any(CreateMilestoneDTO.class)))
                    .thenThrow(new BusinessException(ErrorCode.PROJECT_NOT_FOUND));

            mockMvc.perform(post("/api/projects/99/milestones")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.PROJECT_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/projects/milestones/{milestoneId}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/projects/milestones/{milestoneId}")
    class UpdateMilestoneTests {

        @Test
        @DisplayName("should update a milestone")
        void updateMilestone_success() throws Exception {
            CreateMilestoneDTO dto = buildCreateMilestoneDTO();
            dto.setName("Updated Milestone");
            MilestoneVO result = buildMilestoneVO(1L);
            result.setName("Updated Milestone");
            when(milestoneService.updateMilestone(eq(1L), any(CreateMilestoneDTO.class)))
                    .thenReturn(result);

            mockMvc.perform(put("/api/projects/milestones/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.name").value("Updated Milestone"));

            verify(milestoneService).updateMilestone(eq(1L), any(CreateMilestoneDTO.class));
        }

        @Test
        @DisplayName("should return error when milestone not found")
        void updateMilestone_notFound() throws Exception {
            CreateMilestoneDTO dto = buildCreateMilestoneDTO();
            when(milestoneService.updateMilestone(eq(99L), any(CreateMilestoneDTO.class)))
                    .thenThrow(new BusinessException(ErrorCode.MILESTONE_NOT_FOUND));

            mockMvc.perform(put("/api/projects/milestones/99")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.MILESTONE_NOT_FOUND.getCode()));
        }
    }
}
