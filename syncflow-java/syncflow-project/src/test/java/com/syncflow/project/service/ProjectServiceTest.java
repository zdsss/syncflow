package com.syncflow.project.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.project.dto.CreateProjectDTO;
import com.syncflow.project.dto.ProjectVO;
import com.syncflow.project.entity.Project;
import com.syncflow.project.entity.ProjectMember;
import com.syncflow.project.entity.ProjectPhase;
import com.syncflow.project.mapper.*;
import com.syncflow.project.service.impl.ProjectServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProjectService")
class ProjectServiceTest {

    @Mock
    private ProjectMapper projectMapper;

    @Mock
    private PhaseMapper phaseMapper;

    @Mock
    private MilestoneMapper milestoneMapper;

    @Mock
    private StageGateMapper stageGateMapper;

    @Mock
    private SysUserMapper sysUserMapper;

    @Mock
    private ProjectMemberMapper projectMemberMapper;

    @Mock
    private SysDepartmentMapper sysDepartmentMapper;

    @Mock
    private TaskGanttMapper taskGanttMapper;

    @InjectMocks
    private ProjectServiceImpl projectService;

    private Project buildProject(Long id, String code, Long parentId) {
        Project project = new Project();
        project.setId(id);
        project.setName("Project " + code);
        project.setCode(code);
        project.setDescription("Description");
        project.setOwnerId(1L);
        project.setProjectType("R&D");
        project.setStatus(1);
        project.setProgress(0);
        project.setParentId(parentId);
        return project;
    }

    private CreateProjectDTO buildCreateProjectDTO(String code) {
        CreateProjectDTO dto = new CreateProjectDTO();
        dto.setName("Project " + code);
        dto.setCode(code);
        dto.setDescription("Desc");
        dto.setOwnerId(1L);
        dto.setProjectType("R&D");
        dto.setPlannedStart(LocalDate.of(2026, 1, 1));
        dto.setPlannedEnd(LocalDate.of(2026, 12, 31));
        return dto;
    }

    // -----------------------------------------------------------------------
    //  getProjectTree
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getProjectTree()")
    class GetProjectTree {

        @Test
        @DisplayName("should return tree structure from flat list")
        void shouldReturnTreeStructure() {
            Project parent = buildProject(1L, "PRJ001", null);
            Project child = buildProject(2L, "PRJ002", 1L);

            when(projectMapper.selectProjectTree()).thenReturn(List.of(parent, child));
            when(sysUserMapper.selectRealNameById(anyLong())).thenReturn("Owner");

            List<ProjectVO> result = projectService.getProjectTree();

            assertNotNull(result);
            assertEquals(1, result.size()); // one root
            assertEquals("PRJ001", result.get(0).getCode());
            assertNotNull(result.get(0).getChildren());
            assertEquals(1, result.get(0).getChildren().size());
            assertEquals("PRJ002", result.get(0).getChildren().get(0).getCode());
            verify(projectMapper).selectProjectTree();
        }

        @Test
        @DisplayName("should return empty list when no projects exist")
        void shouldReturnEmptyList() {
            when(projectMapper.selectProjectTree()).thenReturn(Collections.emptyList());

            List<ProjectVO> result = projectService.getProjectTree();

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  getProjectDetail
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getProjectDetail()")
    class GetProjectDetail {

        @Test
        @DisplayName("should return project VO when project exists")
        void shouldReturnProjectVO() {
            Project project = buildProject(1L, "PRJ001", null);
            when(projectMapper.selectById(1L)).thenReturn(project);
            when(sysUserMapper.selectRealNameById(1L)).thenReturn("Owner Name");

            ProjectVO result = projectService.getProjectDetail(1L);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals("PRJ001", result.getCode());
            assertEquals("Project PRJ001", result.getName());
            assertEquals("Owner Name", result.getOwnerName());
            verify(projectMapper).selectById(1L);
        }

        @Test
        @DisplayName("should throw when project not found")
        void shouldThrowWhenProjectNotFound() {
            when(projectMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> projectService.getProjectDetail(999L));
            assertEquals("Project not found", ex.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    //  createProject
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("createProject()")
    class CreateProject {

        @Test
        @DisplayName("should create root project with 6 phases")
        void shouldCreateRootProject() {
            CreateProjectDTO dto = buildCreateProjectDTO("PRJ001");
            when(projectMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(projectMapper.insert(any(Project.class))).thenReturn(1);
            when(phaseMapper.insert(any(ProjectPhase.class))).thenReturn(1);
            when(sysUserMapper.selectRealNameById(anyLong())).thenReturn("Owner");

            ProjectVO result = projectService.createProject(dto);

            assertNotNull(result);
            assertEquals("PRJ001", result.getCode());
            verify(projectMapper).insert(any(Project.class));
            verify(phaseMapper, times(6)).insert(any(ProjectPhase.class)); // 6 standard phases
        }

        @Test
        @DisplayName("should throw when project code already exists")
        void shouldThrowWhenCodeExists() {
            CreateProjectDTO dto = buildCreateProjectDTO("PRJ001");
            when(projectMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> projectService.createProject(dto));
            assertTrue(ex.getMessage().contains("already exists"));
            verify(projectMapper, never()).insert(any(Project.class));
        }
    }

    // -----------------------------------------------------------------------
    //  updateProject
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("updateProject()")
    class UpdateProject {

        @Test
        @DisplayName("should update project fields")
        void shouldUpdateProject() {
            Project existing = buildProject(1L, "PRJ001", null);
            CreateProjectDTO dto = buildCreateProjectDTO("PRJ001");
            dto.setName("Updated Name");

            when(projectMapper.selectById(1L)).thenReturn(existing);
            when(projectMapper.updateById(any(Project.class))).thenReturn(1);
            when(sysUserMapper.selectRealNameById(anyLong())).thenReturn("Owner");

            ProjectVO result = projectService.updateProject(1L, dto);

            assertNotNull(result);
            assertEquals("Updated Name", result.getName());
            verify(projectMapper).updateById(any(Project.class));
        }

        @Test
        @DisplayName("should throw when project not found")
        void shouldThrowWhenProjectNotFound() {
            CreateProjectDTO dto = buildCreateProjectDTO("PRJ001");
            when(projectMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> projectService.updateProject(999L, dto));
            assertEquals("Project not found", ex.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    //  deleteProject
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("deleteProject()")
    class DeleteProject {

        @Test
        @DisplayName("should delete project when no children exist")
        void shouldDeleteProject() {
            Project project = buildProject(1L, "PRJ001", null);
            when(projectMapper.selectById(1L)).thenReturn(project);
            when(projectMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(projectMapper.deleteById(1L)).thenReturn(1);

            projectService.deleteProject(1L);

            verify(projectMapper).selectById(1L);
            verify(projectMapper).deleteById(1L);
        }

        @Test
        @DisplayName("should throw when project not found")
        void shouldThrowWhenProjectNotFound() {
            when(projectMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> projectService.deleteProject(999L));
            assertEquals("Project not found", ex.getMessage());
        }

        @Test
        @DisplayName("should throw when project has children")
        void shouldThrowWhenProjectHasChildren() {
            Project project = buildProject(1L, "PRJ001", null);
            when(projectMapper.selectById(1L)).thenReturn(project);
            when(projectMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(2L);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> projectService.deleteProject(1L));
            assertTrue(ex.getMessage().contains("child projects")
                    || ex.getMessage().contains("Cannot delete"));
            verify(projectMapper, never()).deleteById(anyLong());
        }
    }
}
