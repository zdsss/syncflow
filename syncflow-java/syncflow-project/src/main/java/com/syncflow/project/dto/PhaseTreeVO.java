package com.syncflow.project.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * View object for phase tree, aggregating milestones and stage gates.
 */
@Data
public class PhaseTreeVO {

    private Long id;

    /** FK to prj_project.id. */
    private Long projectId;

    /** Phase display name. */
    private String name;

    /** Phase code. */
    private String code;

    /** Sequence number for ordering. */
    private Integer seqNo;

    /** Phase status: 1=not_started, 2=in_progress, 3=completed. */
    private Integer status;

    /** Completion percentage 0-100. */
    private Integer progress;

    /** Planned phase start date. */
    private LocalDate plannedStart;

    /** Planned phase end date. */
    private LocalDate plannedEnd;

    /** Actual phase start date. */
    private LocalDate actualStart;

    /** Actual phase end date. */
    private LocalDate actualEnd;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    /** Milestones belonging to this phase. */
    private List<MilestoneVO> milestones;

    /** Stage gates belonging to this phase. */
    private List<StageGateVO> stageGates;
}
