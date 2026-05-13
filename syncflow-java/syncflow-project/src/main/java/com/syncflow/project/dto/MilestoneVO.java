package com.syncflow.project.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * View object for milestone display.
 */
@Data
public class MilestoneVO {

    private Long id;

    /** FK to prj_project.id. */
    private Long projectId;

    /** FK to prj_phase.id, NULL if cross-phase. */
    private Long phaseId;

    /** Milestone display name. */
    private String name;

    /** Type: MILESTONE, DELIVERABLE, or REVIEW. */
    private String type;

    /** Status: 1=not_started, 2=in_progress, 3=completed, 4=delayed. */
    private Integer status;

    /** Completion percentage 0-100. */
    private Integer progress;

    /** Target completion date. */
    private LocalDate plannedDate;

    /** Actual completion date. */
    private LocalDate actualDate;

    /** FK to sys_user.id, responsible person. */
    private Long assigneeId;

    /** Description of the deliverable or acceptance criteria. */
    @JsonProperty("description")
    private String deliverable;

    /** FK to parent milestone id. */
    private Long parentMilestoneId;

    /** Workflow engine instance identifier. */
    private String flowInstanceId;

    /** Workflow task identifier. */
    private String taskId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
