package com.syncflow.statistics.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDate;

/**
 * Upcoming milestone item for the dashboard milestones list.
 */
@Data
public class UpcomingMilestoneVO {

    /** Milestone ID. */
    private Long id;

    /** Milestone name. */
    private String name;

    /** Owning project name. */
    private String projectName;

    /** Target completion date. */
    @JsonProperty("dueDate")
    private LocalDate plannedDate;

    /** Milestone status label. */
    private String status;

    /** Days remaining until planned date (negative if overdue). */
    private Integer daysRemaining;
}
