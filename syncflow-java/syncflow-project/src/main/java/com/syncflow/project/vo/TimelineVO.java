package com.syncflow.project.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Value object representing a timeline view of a project or task.
 * <p>
 * Contains planned date range, overall progress, and visual segments
 * for rendering Gantt-style timeline bars.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimelineVO {

    /** ID of the object (project, phase, or task). */
    private Long objectId;

    /** Type of the object: PROJECT, PHASE, TASK. */
    private String objectType;

    /** Planned start date. */
    private LocalDate plannedStart;

    /** Planned end date. */
    private LocalDate plannedEnd;

    /** Overall progress percentage (0-100). */
    private Integer overallProgress;

    /** Visual segments for timeline rendering. */
    private List<Segment> segments;

    /**
     * A visual segment within the timeline bar.
     * Each segment represents a portion of the timeline with a specific status and color.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Segment {
        /** Segment start date. */
        private LocalDate start;

        /** Segment end date. */
        private LocalDate end;

        /** Status of this segment: completed, in_progress, not_started. */
        private String status;

        /** Hex color code for rendering: #FAAD14 (yellow), #3366FF (blue), #8C8C8C (gray). */
        private String color;
    }
}
