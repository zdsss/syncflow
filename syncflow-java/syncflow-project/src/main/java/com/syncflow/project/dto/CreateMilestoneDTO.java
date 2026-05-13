package com.syncflow.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTO for creating or updating a milestone.
 */
@Data
public class CreateMilestoneDTO {

    /** Milestone display name. */
    @NotBlank(message = "Milestone name is required")
    @Size(max = 200, message = "Milestone name must not exceed 200 characters")
    private String name;

    /** Type: MILESTONE, DELIVERABLE, or REVIEW. */
    private String type;

    /** Target completion date. */
    private LocalDate dueDate;

    /** Description or acceptance criteria. */
    private String description;

    /** FK to prj_phase.id (optional). */
    private Long phaseId;

    /** FK to sys_user.id (optional). */
    private Long assigneeId;
}
