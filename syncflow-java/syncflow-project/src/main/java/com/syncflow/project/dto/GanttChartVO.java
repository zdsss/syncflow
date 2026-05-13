package com.syncflow.project.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * View object for Gantt chart data, aggregating phases and milestones.
 */
@Data
public class GanttChartVO {

    /** Earliest date across all tasks. */
    private LocalDate startDate;

    /** Latest date across all tasks. */
    private LocalDate endDate;

    /** Flat list of Gantt tasks (phases and milestones). */
    private List<GanttTaskVO> tasks;

    /** Task dependency relationships (SS/SF/FS/FF). */
    private List<GanttDependencyVO> dependencies;

    /**
     * Task dependency entry for Gantt chart dependency lines.
     */
    @Data
    public static class GanttDependencyVO {
        private Long taskId;
        private Long dependsOnTaskId;
        private String dependencyType;
    }

    /**
     * Individual task entry for Gantt chart rendering.
     */
    @Data
    public static class GanttTaskVO {

        private Long id;

        /** Task display name. */
        private String name;

        /** Task type: PHASE, MILESTONE, or TASK. */
        private String type;

        /** Planned start date (for phases and tasks). */
        private LocalDate plannedStart;

        /** Planned end date (for phases and tasks). */
        private LocalDate plannedEnd;

        /** Planned completion date (for milestones). */
        private LocalDate plannedDate;

        /** Completion percentage 0-100. */
        private Integer progress;

        /** FK to parent project/phase id. */
        private Long parentId;

        /** Status code. */
        private Integer status;

        /** FK to sys_user.id, assignee (for tasks). */
        private Long assigneeId;

        /** Resolved assignee display name (for tasks). */
        private String assigneeName;

        /** FK to prj_phase.id, owning phase (for tasks). */
        private Long phaseId;

        /** FK to prj_milestone.id, owning milestone (for tasks). */
        private Long milestoneId;
    }
}
