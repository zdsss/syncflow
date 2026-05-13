package com.syncflow.task.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.task.entity.Task;
import com.syncflow.task.entity.TaskDependency;
import com.syncflow.task.mapper.TaskDependencyMapper;
import com.syncflow.task.mapper.TaskMapper;
import com.syncflow.task.service.impl.TaskDependencyServiceImpl;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
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

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskDependencyService")
class TaskDependencyServiceTest {

    @BeforeAll
    static void initMybatisPlusCache() {
        // Register entity table metadata for LambdaQueryWrapper in unit tests (no Spring context)
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), TaskDependency.class);
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), Task.class);
    }

    @Mock
    private TaskDependencyMapper dependencyMapper;

    @Mock
    private TaskMapper taskMapper;

    @InjectMocks
    private TaskDependencyServiceImpl dependencyService;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private TaskDependency buildDependency(Long id, Long taskId, Long dependsOnId, String type) {
        TaskDependency dep = new TaskDependency();
        dep.setId(id);
        dep.setTenantId(1L);
        dep.setTaskId(taskId);
        dep.setDependsOnTaskId(dependsOnId);
        dep.setDependencyType(type);
        dep.setCreatedBy(1L);
        return dep;
    }

    private Task buildTask(Long id, String title, Integer status, LocalDate start, LocalDate end) {
        Task task = new Task();
        task.setId(id);
        task.setTitle(title);
        task.setStatus(status);
        task.setPlannedStart(start);
        task.setPlannedEnd(end);
        task.setProjectId(1L);
        task.setTenantId(1L);
        return task;
    }

    // -----------------------------------------------------------------------
    //  Create dependency
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("createDependency")
    class CreateDependency {

        @Test
        @DisplayName("should create FS dependency between two tasks")
        void createDependency_success() {
            Task taskA = buildTask(1L, "Task A", 1, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));
            Task taskB = buildTask(2L, "Task B", 1, LocalDate.of(2026, 5, 6), LocalDate.of(2026, 5, 10));

            when(taskMapper.selectById(1L)).thenReturn(taskA);
            when(taskMapper.selectById(2L)).thenReturn(taskB);
            when(dependencyMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(Collections.emptyList());
            when(dependencyMapper.insert(any(TaskDependency.class))).thenReturn(1);

            TaskDependency result = dependencyService.createDependency(1L, 2L, "FS", 1L);

            assertThat(result).isNotNull();
            assertThat(result.getTaskId()).isEqualTo(1L);
            assertThat(result.getDependsOnTaskId()).isEqualTo(2L);
            assertThat(result.getDependencyType()).isEqualTo("FS");
            verify(dependencyMapper).insert(any(TaskDependency.class));
        }

        @Test
        @DisplayName("should reject self-dependency")
        void createDependency_selfDependency_throws() {
            assertThatThrownBy(() ->
                    dependencyService.createDependency(1L, 1L, "FS", 1L)
            ).isInstanceOf(BusinessException.class)
             .hasMessageContaining("self");
        }

        @Test
        @DisplayName("should reject dependency when tasks are in different projects")
        void createDependency_differentProjects_throws() {
            Task taskA = buildTask(1L, "Task A", 1, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));
            taskA.setProjectId(1L);
            Task taskB = buildTask(2L, "Task B", 1, LocalDate.of(2026, 5, 6), LocalDate.of(2026, 5, 10));
            taskB.setProjectId(2L);

            when(taskMapper.selectById(1L)).thenReturn(taskA);
            when(taskMapper.selectById(2L)).thenReturn(taskB);

            assertThatThrownBy(() ->
                    dependencyService.createDependency(1L, 2L, "FS", 1L)
            ).isInstanceOf(BusinessException.class)
             .hasMessageContaining("project");
        }

        @Test
        @DisplayName("should reject duplicate dependency")
        void createDependency_duplicate_throws() {
            Task taskA = buildTask(1L, "Task A", 1, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));
            Task taskB = buildTask(2L, "Task B", 1, LocalDate.of(2026, 5, 6), LocalDate.of(2026, 5, 10));
            TaskDependency existing = buildDependency(10L, 1L, 2L, "FS");

            when(taskMapper.selectById(1L)).thenReturn(taskA);
            when(taskMapper.selectById(2L)).thenReturn(taskB);
            when(dependencyMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(existing));

            assertThatThrownBy(() ->
                    dependencyService.createDependency(1L, 2L, "FS", 1L)
            ).isInstanceOf(BusinessException.class)
             .hasMessageContaining("already exists");
        }

        @Test
        @DisplayName("should reject dependency that creates a cycle")
        void createDependency_cycleDetection_throws() {
            // A→B→C, trying to add C→A would create a cycle
            Task taskC = buildTask(3L, "Task C", 1, LocalDate.of(2026, 5, 11), LocalDate.of(2026, 5, 15));
            Task taskA = buildTask(1L, "Task A", 1, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));

            when(taskMapper.selectById(3L)).thenReturn(taskC);
            when(taskMapper.selectById(1L)).thenReturn(taskA);

            // Simulate existing chain: A depends on B, B depends on C
            TaskDependency depAB = buildDependency(10L, 1L, 2L, "FS");
            TaskDependency depBC = buildDependency(11L, 2L, 3L, "FS");

            // First call: check duplicates for new dep (C→A) — no existing
            // Subsequent calls in cycle detection DFS:
            // selectList where taskId = 1 → [depAB] (A depends on B)
            // selectList where taskId = 2 → [depBC] (B depends on C)
            // selectList where taskId = 3 → [] (C has no deps)
            // But we're checking if adding C→A creates cycle: DFS from A finds C→A→...→C? No cycle here actually.
            // Let's test the actual cycle: A→B, B→C, trying C→A
            // DFS from A (new dep's dependsOn=1): look at tasks that depend on 1... wait no.
            // Cycle check: after adding C→A, can we reach C from A? A→B→C→A yes!
            // The DFS starts from dependsOnTaskId (A=1), follows dependencies forward:
            //   1 depends on 2, 2 depends on 3, 3 depends on 1 → cycle!

            when(dependencyMapper.selectList(argThat(wrapper -> true)))
                    .thenReturn(Collections.emptyList())  // first call: duplicate check
                    .thenReturn(List.of(depAB))           // cycle DFS: task 1 deps
                    .thenReturn(List.of(depBC))           // cycle DFS: task 2 deps
                    .thenReturn(Collections.emptyList());  // cycle DFS: task 3 deps

            assertThatThrownBy(() ->
                    dependencyService.createDependency(3L, 1L, "FS", 1L)
            ).isInstanceOf(BusinessException.class)
             .hasMessageContaining("cycle");
        }
    }

    // -----------------------------------------------------------------------
    //  Query dependencies
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getDependencies")
    class GetDependencies {

        @Test
        @DisplayName("should return all dependencies for a task")
        void getDependenciesByTask_success() {
            TaskDependency dep = buildDependency(1L, 1L, 2L, "FS");
            when(dependencyMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(dep));

            List<TaskDependency> result = dependencyService.getDependenciesByTask(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getDependencyType()).isEqualTo("FS");
        }

        @Test
        @DisplayName("should return empty list when task has no dependencies")
        void getDependenciesByTask_empty() {
            when(dependencyMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());

            List<TaskDependency> result = dependencyService.getDependenciesByTask(99L);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should return all dependencies for a project")
        void getDependenciesByProject_success() {
            Task task1 = buildTask(1L, "Task 1", 1, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));
            Task task2 = buildTask(2L, "Task 2", 1, LocalDate.of(2026, 5, 6), LocalDate.of(2026, 5, 10));
            Task task3 = buildTask(3L, "Task 3", 1, LocalDate.of(2026, 5, 11), LocalDate.of(2026, 5, 15));
            when(taskMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(task1, task2, task3));

            TaskDependency dep1 = buildDependency(1L, 1L, 2L, "FS");
            TaskDependency dep2 = buildDependency(2L, 2L, 3L, "SS");
            when(dependencyMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(dep1, dep2));

            List<TaskDependency> result = dependencyService.getDependenciesByProject(1L);

            assertThat(result).hasSize(2);
        }
    }

    // -----------------------------------------------------------------------
    //  Delete dependency
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("deleteDependency")
    class DeleteDependency {

        @Test
        @DisplayName("should delete an existing dependency")
        void deleteDependency_success() {
            TaskDependency existing = buildDependency(1L, 1L, 2L, "FS");
            when(dependencyMapper.selectById(1L)).thenReturn(existing);
            when(dependencyMapper.deleteById(1L)).thenReturn(1);

            dependencyService.deleteDependency(1L, 1L);

            verify(dependencyMapper).deleteById(1L);
        }

        @Test
        @DisplayName("should throw when dependency not found")
        void deleteDependency_notFound_throws() {
            when(dependencyMapper.selectById(99L)).thenReturn(null);

            assertThatThrownBy(() ->
                    dependencyService.deleteDependency(99L, 1L)
            ).isInstanceOf(BusinessException.class);
        }

        @Test
        @DisplayName("should throw when user is not the creator")
        void deleteDependency_notCreator_throws() {
            TaskDependency existing = buildDependency(1L, 1L, 2L, "FS");
            existing.setCreatedBy(1L);
            when(dependencyMapper.selectById(1L)).thenReturn(existing);

            assertThatThrownBy(() ->
                    dependencyService.deleteDependency(1L, 999L)
            ).isInstanceOf(BusinessException.class)
             .hasMessageContaining("creator");
        }
    }

    // -----------------------------------------------------------------------
    //  Update dependency type
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("updateDependencyType")
    class UpdateDependencyType {

        @Test
        @DisplayName("should update dependency type from FS to SS")
        void updateDependencyType_success() {
            TaskDependency existing = buildDependency(1L, 1L, 2L, "FS");
            when(dependencyMapper.selectById(1L)).thenReturn(existing);
            when(dependencyMapper.updateById(any(TaskDependency.class))).thenReturn(1);

            TaskDependency result = dependencyService.updateDependencyType(1L, "SS");

            assertThat(result.getDependencyType()).isEqualTo("SS");
            verify(dependencyMapper).updateById(any(TaskDependency.class));
        }

        @Test
        @DisplayName("should reject invalid dependency type")
        void updateDependencyType_invalidType_throws() {
            assertThatThrownBy(() ->
                    dependencyService.updateDependencyType(1L, "XX")
            ).isInstanceOf(BusinessException.class)
             .hasMessageContaining("type");
        }
    }
}
