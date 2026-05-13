package com.syncflow.project.service.impl;

import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.project.entity.Project;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.project.mapper.TaskTimelineMapper;
import com.syncflow.project.service.TimelineService;
import com.syncflow.project.vo.TimelineVO;
import com.syncflow.project.vo.TimelineVO.Segment;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Implementation of {@link TimelineService}.
 * <p>
 * Computes timeline views by aggregating task data into color-coded segments.
 * Segment colors follow the convention:
 * <ul>
 *   <li>{@code #FAAD14} (yellow) — completed tasks (status 4)</li>
 *   <li>{@code #3366FF} (blue) — in-progress tasks (status 2, 3)</li>
 *   <li>{@code #8C8C8C} (gray) — not-started tasks (status 1, 5)</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class TimelineServiceImpl implements TimelineService {

    private final ProjectMapper projectMapper;
    private final TaskTimelineMapper taskTimelineMapper;

    /** Task status codes. */
    private static final int STATUS_PENDING = 1;
    private static final int STATUS_IN_PROGRESS = 2;
    private static final int STATUS_PENDING_REVIEW = 3;
    private static final int STATUS_COMPLETED = 4;
    private static final int STATUS_CANCELLED = 5;

    /** Segment colors. */
    private static final String COLOR_COMPLETED = "#FAAD14";
    private static final String COLOR_IN_PROGRESS = "#3366FF";
    private static final String COLOR_NOT_STARTED = "#8C8C8C";

    /** Segment status labels. */
    private static final String LABEL_COMPLETED = "completed";
    private static final String LABEL_IN_PROGRESS = "in_progress";
    private static final String LABEL_NOT_STARTED = "not_started";

    @Override
    public TimelineVO getProjectTimeline(Long projectId) {
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }

        List<Map<String, Object>> taskData = taskTimelineMapper.selectTaskTimelines(projectId);

        TimelineVO vo = new TimelineVO();
        vo.setObjectId(projectId);
        vo.setObjectType("PROJECT");
        vo.setPlannedStart(project.getPlannedStart());
        vo.setPlannedEnd(project.getPlannedEnd());

        if (taskData.isEmpty()) {
            vo.setOverallProgress(0);
            vo.setSegments(List.of());
            return vo;
        }

        List<Segment> segments = buildSegments(taskData);
        vo.setSegments(segments);

        int progress = computeOverallProgress(taskData);
        vo.setOverallProgress(progress);

        return vo;
    }

    @Override
    public TimelineVO getTaskTimeline(Long taskId) {
        Map<String, Object> taskData = taskTimelineMapper.selectTaskTimeline(taskId);
        if (taskData == null || taskData.isEmpty()) {
            throw new BusinessException(ErrorCode.TASK_NOT_FOUND);
        }

        LocalDate plannedStart = toLocalDate(taskData.get("planned_start"));
        LocalDate plannedEnd = toLocalDate(taskData.get("planned_end"));
        Integer status = toInteger(taskData.get("status"));

        TimelineVO vo = new TimelineVO();
        vo.setObjectId(taskId);
        vo.setObjectType("TASK");
        vo.setPlannedStart(plannedStart);
        vo.setPlannedEnd(plannedEnd);

        if (plannedStart == null || plannedEnd == null) {
            vo.setOverallProgress(0);
            vo.setSegments(List.of());
            return vo;
        }

        Segment segment = new Segment(plannedStart, plannedEnd,
                statusLabel(status), statusColor(status));
        vo.setSegments(List.of(segment));

        vo.setOverallProgress(status == STATUS_COMPLETED ? 100 :
                status == STATUS_IN_PROGRESS || status == STATUS_PENDING_REVIEW ? 50 : 0);

        return vo;
    }

    /**
     * Build segments from task data by creating a segment per task.
     * Segments are sorted by planned_start and merged when they have the same status
     * and are adjacent or overlapping.
     */
    List<Segment> buildSegments(List<Map<String, Object>> taskData) {
        List<Segment> raw = new ArrayList<>();
        for (Map<String, Object> row : taskData) {
            LocalDate start = toLocalDate(row.get("planned_start"));
            LocalDate end = toLocalDate(row.get("planned_end"));
            Integer status = toInteger(row.get("status"));
            if (start != null && end != null) {
                raw.add(new Segment(start, end, statusLabel(status), statusColor(status)));
            }
        }

        // Sort by start date
        raw.sort((a, b) -> a.getStart().compareTo(b.getStart()));

        // Merge adjacent/overlapping segments with the same status
        List<Segment> merged = new ArrayList<>();
        for (Segment seg : raw) {
            if (!merged.isEmpty()) {
                Segment last = merged.get(merged.size() - 1);
                if (last.getStatus().equals(seg.getStatus())
                        && !seg.getStart().isAfter(last.getEnd().plusDays(1))) {
                    // Merge: extend the last segment's end date
                    if (seg.getEnd().isAfter(last.getEnd())) {
                        last.setEnd(seg.getEnd());
                    }
                    continue;
                }
            }
            merged.add(seg);
        }

        return merged;
    }

    /**
     * Compute overall progress as the percentage of completed tasks.
     */
    int computeOverallProgress(List<Map<String, Object>> taskData) {
        long total = taskData.size();
        long completed = taskData.stream()
                .filter(row -> {
                    Integer status = toInteger(row.get("status"));
                    return status != null && status == STATUS_COMPLETED;
                })
                .count();
        return (int) (completed * 100 / total);
    }

    /**
     * Map task status code to segment color.
     */
    static String statusColor(Integer status) {
        if (status == null) return COLOR_NOT_STARTED;
        return switch (status) {
            case STATUS_COMPLETED -> COLOR_COMPLETED;
            case STATUS_IN_PROGRESS, STATUS_PENDING_REVIEW -> COLOR_IN_PROGRESS;
            default -> COLOR_NOT_STARTED;
        };
    }

    /**
     * Map task status code to segment label.
     */
    static String statusLabel(Integer status) {
        if (status == null) return LABEL_NOT_STARTED;
        return switch (status) {
            case STATUS_COMPLETED -> LABEL_COMPLETED;
            case STATUS_IN_PROGRESS, STATUS_PENDING_REVIEW -> LABEL_IN_PROGRESS;
            default -> LABEL_NOT_STARTED;
        };
    }

    /**
     * Safely convert a database value to LocalDate.
     */
    private LocalDate toLocalDate(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDate ld) return ld;
        if (value instanceof java.sql.Date d) return d.toLocalDate();
        if (value instanceof java.time.temporal.Temporal t) return LocalDate.from(t);
        return null;
    }

    /**
     * Safely convert a database value to Integer.
     */
    private Integer toInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Integer i) return i;
        if (value instanceof Number n) return n.intValue();
        return null;
    }
}
