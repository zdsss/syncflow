package com.syncflow.project.service.impl;

import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.project.entity.Project;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.project.mapper.TaskTimelineMapper;
import com.syncflow.project.vo.TimelineVO;
import com.syncflow.project.vo.TimelineVO.Segment;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("TimelineServiceImpl")
class TimelineServiceImplTest {

    @Mock
    private ProjectMapper projectMapper;

    @Mock
    private TaskTimelineMapper taskTimelineMapper;

    @InjectMocks
    private TimelineServiceImpl timelineService;

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private Project buildProject(Long id, LocalDate plannedStart, LocalDate plannedEnd) {
        Project p = new Project();
        p.setId(id);
        p.setName("Test Project");
        p.setCode("TP-001");
        p.setPlannedStart(plannedStart);
        p.setPlannedEnd(plannedEnd);
        return p;
    }

    private Map<String, Object> buildTaskRow(Integer status, LocalDate plannedStart, LocalDate plannedEnd) {
        Map<String, Object> row = new HashMap<>();
        row.put("status", status);
        row.put("planned_start", plannedStart);
        row.put("planned_end", plannedEnd);
        return row;
    }

    // -----------------------------------------------------------------------
    // getProjectTimeline
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getProjectTimeline")
    class GetProjectTimeline {

        @Test
        @DisplayName("should throw BusinessException when project not found")
        void projectNotFound() {
            when(projectMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> timelineService.getProjectTimeline(999L));

            assertEquals(ErrorCode.PROJECT_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("should return empty segments when project has no tasks")
        void projectWithNoTasks() {
            Project project = buildProject(1L,
                    LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31));
            when(projectMapper.selectById(1L)).thenReturn(project);
            when(taskTimelineMapper.selectTaskTimelines(1L)).thenReturn(List.of());

            TimelineVO vo = timelineService.getProjectTimeline(1L);

            assertEquals(1L, vo.getObjectId());
            assertEquals("PROJECT", vo.getObjectType());
            assertEquals(LocalDate.of(2026, 1, 1), vo.getPlannedStart());
            assertEquals(LocalDate.of(2026, 12, 31), vo.getPlannedEnd());
            assertEquals(0, vo.getOverallProgress());
            assertTrue(vo.getSegments().isEmpty());
        }

        @Test
        @DisplayName("all completed: should produce yellow segments with 100% progress")
        void allCompleted() {
            Project project = buildProject(1L,
                    LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 30));
            when(projectMapper.selectById(1L)).thenReturn(project);

            List<Map<String, Object>> tasks = List.of(
                    buildTaskRow(4, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 28)),
                    buildTaskRow(4, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 4, 30)),
                    buildTaskRow(4, LocalDate.of(2026, 5, 1), LocalDate.of(2026, 6, 30))
            );
            when(taskTimelineMapper.selectTaskTimelines(1L)).thenReturn(tasks);

            TimelineVO vo = timelineService.getProjectTimeline(1L);

            assertEquals(100, vo.getOverallProgress());
            assertFalse(vo.getSegments().isEmpty());
            for (Segment seg : vo.getSegments()) {
                assertEquals("completed", seg.getStatus());
                assertEquals("#FAAD14", seg.getColor());
            }
            // Tasks are contiguous (1/1-2/28, 3/1-4/30, 5/1-6/30), so they merge into one
            assertEquals(1, vo.getSegments().size());
            assertEquals(LocalDate.of(2026, 1, 1), vo.getSegments().get(0).getStart());
            assertEquals(LocalDate.of(2026, 6, 30), vo.getSegments().get(0).getEnd());
        }

        @Test
        @DisplayName("mixed statuses: should produce multi-color segments")
        void mixedStatuses() {
            Project project = buildProject(1L,
                    LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 30));
            when(projectMapper.selectById(1L)).thenReturn(project);

            List<Map<String, Object>> tasks = List.of(
                    buildTaskRow(4, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 28)),    // completed
                    buildTaskRow(2, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31)),    // in_progress
                    buildTaskRow(1, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 6, 30))     // pending
            );
            when(taskTimelineMapper.selectTaskTimelines(1L)).thenReturn(tasks);

            TimelineVO vo = timelineService.getProjectTimeline(1L);

            // 1 out of 3 completed = 33%
            assertEquals(33, vo.getOverallProgress());
            assertEquals(3, vo.getSegments().size());

            // Segment 1: completed (yellow)
            assertEquals("completed", vo.getSegments().get(0).getStatus());
            assertEquals("#FAAD14", vo.getSegments().get(0).getColor());
            assertEquals(LocalDate.of(2026, 1, 1), vo.getSegments().get(0).getStart());
            assertEquals(LocalDate.of(2026, 2, 28), vo.getSegments().get(0).getEnd());

            // Segment 2: in_progress (blue)
            assertEquals("in_progress", vo.getSegments().get(1).getStatus());
            assertEquals("#3366FF", vo.getSegments().get(1).getColor());
            assertEquals(LocalDate.of(2026, 3, 1), vo.getSegments().get(1).getStart());
            assertEquals(LocalDate.of(2026, 3, 31), vo.getSegments().get(1).getEnd());

            // Segment 3: not_started (gray)
            assertEquals("not_started", vo.getSegments().get(2).getStatus());
            assertEquals("#8C8C8C", vo.getSegments().get(2).getColor());
            assertEquals(LocalDate.of(2026, 4, 1), vo.getSegments().get(2).getStart());
            assertEquals(LocalDate.of(2026, 6, 30), vo.getSegments().get(2).getEnd());
        }

        @Test
        @DisplayName("all pending: should produce gray segments with 0% progress")
        void allPending() {
            Project project = buildProject(1L,
                    LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 30));
            when(projectMapper.selectById(1L)).thenReturn(project);

            List<Map<String, Object>> tasks = List.of(
                    buildTaskRow(1, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31)),
                    buildTaskRow(1, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 6, 30))
            );
            when(taskTimelineMapper.selectTaskTimelines(1L)).thenReturn(tasks);

            TimelineVO vo = timelineService.getProjectTimeline(1L);

            assertEquals(0, vo.getOverallProgress());
            assertFalse(vo.getSegments().isEmpty());
            for (Segment seg : vo.getSegments()) {
                assertEquals("not_started", seg.getStatus());
                assertEquals("#8C8C8C", seg.getColor());
            }
        }

        @Test
        @DisplayName("cancelled tasks should be treated as not_started")
        void cancelledTasks() {
            Project project = buildProject(1L,
                    LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31));
            when(projectMapper.selectById(1L)).thenReturn(project);

            List<Map<String, Object>> tasks = List.of(
                    buildTaskRow(5, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31))
            );
            when(taskTimelineMapper.selectTaskTimelines(1L)).thenReturn(tasks);

            TimelineVO vo = timelineService.getProjectTimeline(1L);

            assertEquals(0, vo.getOverallProgress());
            assertEquals(1, vo.getSegments().size());
            assertEquals("not_started", vo.getSegments().get(0).getStatus());
            assertEquals("#8C8C8C", vo.getSegments().get(0).getColor());
        }

        @Test
        @DisplayName("pending_review tasks should be treated as in_progress (blue)")
        void pendingReviewTasks() {
            Project project = buildProject(1L,
                    LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31));
            when(projectMapper.selectById(1L)).thenReturn(project);

            List<Map<String, Object>> tasks = List.of(
                    buildTaskRow(3, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 28)),
                    buildTaskRow(3, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31))
            );
            when(taskTimelineMapper.selectTaskTimelines(1L)).thenReturn(tasks);

            TimelineVO vo = timelineService.getProjectTimeline(1L);

            assertEquals(0, vo.getOverallProgress());
            assertEquals(1, vo.getSegments().size()); // merged, same status + contiguous
            assertEquals("in_progress", vo.getSegments().get(0).getStatus());
            assertEquals("#3366FF", vo.getSegments().get(0).getColor());
        }

        @Test
        @DisplayName("tasks with null dates should be skipped for segments but still count for progress")
        void tasksWithNullDates() {
            Project project = buildProject(1L,
                    LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 30));
            when(projectMapper.selectById(1L)).thenReturn(project);

            List<Map<String, Object>> tasks = List.of(
                    buildTaskRow(4, null, LocalDate.of(2026, 2, 28)),  // null start, skipped for segment
                    buildTaskRow(1, LocalDate.of(2026, 3, 1), null),    // null end, skipped for segment
                    buildTaskRow(2, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 6, 30)) // valid
            );
            when(taskTimelineMapper.selectTaskTimelines(1L)).thenReturn(tasks);

            TimelineVO vo = timelineService.getProjectTimeline(1L);

            // 1 completed out of 3 total tasks = 33% (null-date tasks still count toward progress)
            assertEquals(33, vo.getOverallProgress());
            // Only the valid task produces a segment
            assertEquals(1, vo.getSegments().size());
            assertEquals("in_progress", vo.getSegments().get(0).getStatus());
        }
    }

    // -----------------------------------------------------------------------
    // getTaskTimeline
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getTaskTimeline")
    class GetTaskTimeline {

        @Test
        @DisplayName("should throw BusinessException when task not found")
        void taskNotFound() {
            when(taskTimelineMapper.selectTaskTimeline(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> timelineService.getTaskTimeline(999L));

            assertEquals(ErrorCode.TASK_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("should throw BusinessException when task data is empty map")
        void taskDataEmpty() {
            when(taskTimelineMapper.selectTaskTimeline(999L)).thenReturn(new HashMap<>());

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> timelineService.getTaskTimeline(999L));

            assertEquals(ErrorCode.TASK_NOT_FOUND, ex.getErrorCode());
        }

        @Test
        @DisplayName("completed task: yellow segment, 100% progress")
        void completedTask() {
            Map<String, Object> data = new HashMap<>();
            data.put("id", 1L);
            data.put("status", 4);
            data.put("planned_start", LocalDate.of(2026, 1, 1));
            data.put("planned_end", LocalDate.of(2026, 2, 28));
            when(taskTimelineMapper.selectTaskTimeline(1L)).thenReturn(data);

            TimelineVO vo = timelineService.getTaskTimeline(1L);

            assertEquals(1L, vo.getObjectId());
            assertEquals("TASK", vo.getObjectType());
            assertEquals(100, vo.getOverallProgress());
            assertEquals(1, vo.getSegments().size());

            Segment seg = vo.getSegments().get(0);
            assertEquals("completed", seg.getStatus());
            assertEquals("#FAAD14", seg.getColor());
            assertEquals(LocalDate.of(2026, 1, 1), seg.getStart());
            assertEquals(LocalDate.of(2026, 2, 28), seg.getEnd());
        }

        @Test
        @DisplayName("in_progress task: blue segment, 50% progress")
        void inProgressTask() {
            Map<String, Object> data = new HashMap<>();
            data.put("id", 2L);
            data.put("status", 2);
            data.put("planned_start", LocalDate.of(2026, 3, 1));
            data.put("planned_end", LocalDate.of(2026, 4, 30));
            when(taskTimelineMapper.selectTaskTimeline(2L)).thenReturn(data);

            TimelineVO vo = timelineService.getTaskTimeline(2L);

            assertEquals(50, vo.getOverallProgress());
            assertEquals("in_progress", vo.getSegments().get(0).getStatus());
            assertEquals("#3366FF", vo.getSegments().get(0).getColor());
        }

        @Test
        @DisplayName("pending task: gray segment, 0% progress")
        void pendingTask() {
            Map<String, Object> data = new HashMap<>();
            data.put("id", 3L);
            data.put("status", 1);
            data.put("planned_start", LocalDate.of(2026, 5, 1));
            data.put("planned_end", LocalDate.of(2026, 6, 30));
            when(taskTimelineMapper.selectTaskTimeline(3L)).thenReturn(data);

            TimelineVO vo = timelineService.getTaskTimeline(3L);

            assertEquals(0, vo.getOverallProgress());
            assertEquals("not_started", vo.getSegments().get(0).getStatus());
            assertEquals("#8C8C8C", vo.getSegments().get(0).getColor());
        }

        @Test
        @DisplayName("task with null dates should return empty segments")
        void taskWithNullDates() {
            Map<String, Object> data = new HashMap<>();
            data.put("id", 4L);
            data.put("status", 1);
            data.put("planned_start", null);
            data.put("planned_end", null);
            when(taskTimelineMapper.selectTaskTimeline(4L)).thenReturn(data);

            TimelineVO vo = timelineService.getTaskTimeline(4L);

            assertEquals(0, vo.getOverallProgress());
            assertTrue(vo.getSegments().isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    // Unit-level helper method tests
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("statusColor")
    class StatusColorTests {

        @Test
        @DisplayName("completed -> yellow")
        void completedColor() {
            assertEquals("#FAAD14", TimelineServiceImpl.statusColor(4));
        }

        @Test
        @DisplayName("in_progress -> blue")
        void inProgressColor() {
            assertEquals("#3366FF", TimelineServiceImpl.statusColor(2));
        }

        @Test
        @DisplayName("pending_review -> blue")
        void pendingReviewColor() {
            assertEquals("#3366FF", TimelineServiceImpl.statusColor(3));
        }

        @Test
        @DisplayName("pending -> gray")
        void pendingColor() {
            assertEquals("#8C8C8C", TimelineServiceImpl.statusColor(1));
        }

        @Test
        @DisplayName("cancelled -> gray")
        void cancelledColor() {
            assertEquals("#8C8C8C", TimelineServiceImpl.statusColor(5));
        }

        @Test
        @DisplayName("null -> gray")
        void nullColor() {
            assertEquals("#8C8C8C", TimelineServiceImpl.statusColor(null));
        }
    }

    @Nested
    @DisplayName("buildSegments (merging)")
    class BuildSegmentsTests {

        @Test
        @DisplayName("should merge adjacent segments with same status")
        void mergeAdjacent() {
            List<Map<String, Object>> data = List.of(
                    buildTaskRow(4, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 28)),
                    buildTaskRow(4, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 4, 30))
            );

            List<Segment> segments = timelineService.buildSegments(data);

            assertEquals(1, segments.size());
            assertEquals(LocalDate.of(2026, 1, 1), segments.get(0).getStart());
            assertEquals(LocalDate.of(2026, 4, 30), segments.get(0).getEnd());
        }

        @Test
        @DisplayName("should merge overlapping segments with same status")
        void mergeOverlapping() {
            List<Map<String, Object>> data = List.of(
                    buildTaskRow(1, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31)),
                    buildTaskRow(1, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 5, 31))
            );

            List<Segment> segments = timelineService.buildSegments(data);

            assertEquals(1, segments.size());
            assertEquals(LocalDate.of(2026, 1, 1), segments.get(0).getStart());
            assertEquals(LocalDate.of(2026, 5, 31), segments.get(0).getEnd());
        }

        @Test
        @DisplayName("should not merge segments with different status")
        void noMergeDifferentStatus() {
            List<Map<String, Object>> data = List.of(
                    buildTaskRow(4, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 28)),
                    buildTaskRow(1, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 4, 30))
            );

            List<Segment> segments = timelineService.buildSegments(data);

            assertEquals(2, segments.size());
        }

        @Test
        @DisplayName("should skip tasks with null dates")
        void skipNullDates() {
            List<Map<String, Object>> data = List.of(
                    buildTaskRow(4, null, LocalDate.of(2026, 2, 28)),
                    buildTaskRow(1, LocalDate.of(2026, 3, 1), null),
                    buildTaskRow(2, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 5, 31))
            );

            List<Segment> segments = timelineService.buildSegments(data);

            assertEquals(1, segments.size());
            assertEquals("in_progress", segments.get(0).getStatus());
        }
    }

    @Nested
    @DisplayName("computeOverallProgress")
    class ComputeOverallProgressTests {

        @Test
        @DisplayName("all completed -> 100")
        void allCompleted() {
            List<Map<String, Object>> data = List.of(
                    buildTaskRow(4, null, null),
                    buildTaskRow(4, null, null)
            );
            assertEquals(100, timelineService.computeOverallProgress(data));
        }

        @Test
        @DisplayName("none completed -> 0")
        void noneCompleted() {
            List<Map<String, Object>> data = List.of(
                    buildTaskRow(1, null, null),
                    buildTaskRow(2, null, null),
                    buildTaskRow(3, null, null)
            );
            assertEquals(0, timelineService.computeOverallProgress(data));
        }

        @Test
        @DisplayName("1 of 3 completed -> 33")
        void partialCompletion() {
            List<Map<String, Object>> data = List.of(
                    buildTaskRow(4, null, null),
                    buildTaskRow(1, null, null),
                    buildTaskRow(2, null, null)
            );
            assertEquals(33, timelineService.computeOverallProgress(data));
        }

        @Test
        @DisplayName("2 of 3 completed -> 66")
        void twoThirdsCompletion() {
            List<Map<String, Object>> data = List.of(
                    buildTaskRow(4, null, null),
                    buildTaskRow(4, null, null),
                    buildTaskRow(1, null, null)
            );
            assertEquals(66, timelineService.computeOverallProgress(data));
        }
    }
}
