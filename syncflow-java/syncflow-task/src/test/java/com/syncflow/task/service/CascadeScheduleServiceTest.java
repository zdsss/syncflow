package com.syncflow.task.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.syncflow.task.entity.Task;
import com.syncflow.task.entity.TaskDependency;
import com.syncflow.task.mapper.TaskDependencyMapper;
import com.syncflow.task.mapper.TaskMapper;
import com.syncflow.task.service.impl.CascadeScheduleServiceImpl;
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
@DisplayName("CascadeScheduleService")
class CascadeScheduleServiceTest {

    @BeforeAll
    static void initMybatisPlusCache() {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), TaskDependency.class);
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), Task.class);
    }

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private TaskDependencyMapper dependencyMapper;

    @InjectMocks
    private CascadeScheduleServiceImpl cascadeScheduleService;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

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

    // -----------------------------------------------------------------------
    //  cascadeSchedule
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("cascadeSchedule")
    class CascadeScheduleTests {

        @Test
        @DisplayName("FS: changing Task A's end date should shift dependent Task B forward")
        void cascadeSchedule_FS_success() {
            // Arrange: Task A (May 1-5) -> Task B (May 6-10), FS dependency
            Task taskA = buildTask(1L, "Task A", 2, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));
            Task taskB = buildTask(2L, "Task B", 1, LocalDate.of(2026, 5, 6), LocalDate.of(2026, 5, 10));
            TaskDependency dep = buildDependency(1L, 2L, 1L, "FS");

            // selectById for taskA in cascade(); selectById for taskA (visited check skip);
            // then selectById for taskB
            when(taskMapper.selectById(1L)).thenReturn(taskA);
            when(taskMapper.selectById(2L)).thenReturn(taskB);
            when(dependencyMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(dep));
            doReturn(1).when(taskMapper).updateById((Task) any());

            // Act: Move Task A to May 6-10 (newEnd shifts +5 days)
            cascadeScheduleService.cascadeSchedule(1L,
                    LocalDate.of(2026, 5, 6), LocalDate.of(2026, 5, 10));

            // Assert: Task B should now be May 11-15 (starts after A's new end + 1 day)
            verify(taskMapper).updateById(argThat((Task t) ->
                    t.getId().equals(2L)
                            && t.getPlannedStart().equals(LocalDate.of(2026, 5, 11))
                            && t.getPlannedEnd().equals(LocalDate.of(2026, 5, 15))
            ));
        }

        @Test
        @DisplayName("SS: changing Task A's start date should make dependent Task B follow")
        void cascadeSchedule_SS_success() {
            // Arrange: Task A (May 1-5) -> Task B (May 1-8), SS dependency
            Task taskA = buildTask(1L, "Task A", 2, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));
            Task taskB = buildTask(2L, "Task B", 1, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 8));
            TaskDependency dep = buildDependency(1L, 2L, 1L, "SS");

            when(taskMapper.selectById(1L)).thenReturn(taskA);
            when(taskMapper.selectById(2L)).thenReturn(taskB);
            when(dependencyMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(dep));
            doReturn(1).when(taskMapper).updateById((Task) any());

            // Act: Move Task A start to May 5
            cascadeScheduleService.cascadeSchedule(1L,
                    LocalDate.of(2026, 5, 5), LocalDate.of(2026, 5, 9));

            // Assert: Task B should now be May 5-12 (same start, preserves 7-day duration)
            verify(taskMapper).updateById(argThat((Task t) ->
                    t.getId().equals(2L)
                            && t.getPlannedStart().equals(LocalDate.of(2026, 5, 5))
                            && t.getPlannedEnd().equals(LocalDate.of(2026, 5, 12))
            ));
        }

        @Test
        @DisplayName("should skip dependent task when its status is completed (4)")
        void cascadeSchedule_skipsCompleted() {
            // Arrange: Task A -> Task B (FS), Task B is completed
            Task taskA = buildTask(1L, "Task A", 2, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));
            Task taskB = buildTask(2L, "Task B", 4, LocalDate.of(2026, 5, 6), LocalDate.of(2026, 5, 10));
            TaskDependency dep = buildDependency(1L, 2L, 1L, "FS");

            when(taskMapper.selectById(1L)).thenReturn(taskA);
            when(taskMapper.selectById(2L)).thenReturn(taskB);
            when(dependencyMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(dep));
            doReturn(1).when(taskMapper).updateById((Task) any());

            // Act
            cascadeScheduleService.cascadeSchedule(1L,
                    LocalDate.of(2026, 5, 6), LocalDate.of(2026, 5, 10));

            // Assert: Task A updated, but Task B (completed) should NOT be updated
            verify(taskMapper, times(1)).updateById((Task) any());
            verify(taskMapper).updateById(argThat((Task t) -> t.getId().equals(1L)));
        }

        @Test
        @DisplayName("should only update the task itself when there are no dependents")
        void cascadeSchedule_noDependents() {
            // Arrange: Task A has no dependents
            Task taskA = buildTask(1L, "Task A", 1, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));

            when(taskMapper.selectById(1L)).thenReturn(taskA);
            when(dependencyMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());
            doReturn(1).when(taskMapper).updateById((Task) any());

            // Act: Change Task A to May 10-14
            cascadeScheduleService.cascadeSchedule(1L,
                    LocalDate.of(2026, 5, 10), LocalDate.of(2026, 5, 14));

            // Assert: Only one update (for Task A itself)
            verify(taskMapper, times(1)).updateById(argThat((Task t) ->
                    t.getId().equals(1L)
                            && t.getPlannedStart().equals(LocalDate.of(2026, 5, 10))
                            && t.getPlannedEnd().equals(LocalDate.of(2026, 5, 14))
            ));
        }
    }

    // -----------------------------------------------------------------------
    //  previewCascade
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("previewCascade")
    class PreviewCascadeTests {

        @Test
        @DisplayName("should return affected tasks without persisting changes")
        void previewCascade_returnsAffectedTasks() {
            // Arrange: Task A (May 1-5) -> Task B (May 6-10), FS dependency
            Task taskA = buildTask(1L, "Task A", 2, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 5, 5));
            Task taskB = buildTask(2L, "Task B", 1, LocalDate.of(2026, 5, 6), LocalDate.of(2026, 5, 10));
            TaskDependency dep = buildDependency(1L, 2L, 1L, "FS");

            when(taskMapper.selectById(1L)).thenReturn(taskA);
            when(taskMapper.selectById(2L)).thenReturn(taskB);
            when(dependencyMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(dep));

            // Act
            List<Task> result = cascadeScheduleService.previewCascade(1L,
                    LocalDate.of(2026, 5, 6), LocalDate.of(2026, 5, 10));

            // Assert: Two tasks returned (A and B), with correct projected dates
            assertThat(result).hasSize(2);

            assertThat(result.get(0).getId()).isEqualTo(1L);
            assertThat(result.get(0).getPlannedStart()).isEqualTo(LocalDate.of(2026, 5, 6));
            assertThat(result.get(0).getPlannedEnd()).isEqualTo(LocalDate.of(2026, 5, 10));

            assertThat(result.get(1).getId()).isEqualTo(2L);
            assertThat(result.get(1).getPlannedStart()).isEqualTo(LocalDate.of(2026, 5, 11));
            assertThat(result.get(1).getPlannedEnd()).isEqualTo(LocalDate.of(2026, 5, 15));

            // Assert: No database writes should have occurred
            verify(taskMapper, never()).updateById((Task) any());
        }
    }
}
