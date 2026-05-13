package com.syncflow.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * DTO for creating a new project.
 */
@Data
public class CreateProjectDTO {

    /** Project display name. */
    @NotBlank(message = "Project name is required")
    @Size(max = 200, message = "Project name must not exceed 200 characters")
    private String name;

    /** Unique project code. */
    @NotBlank(message = "Project code is required")
    @Size(max = 50, message = "Project code must not exceed 50 characters")
    private String code;

    /** Rich-text project description. */
    private String description;

    /** FK to sys_user.id, project owner / manager. */
    @NotNull(message = "Owner ID is required")
    private Long ownerId;

    /** Project classification: R&D, PRODUCTION, MAINTENANCE, etc. */
    private String projectType;

    /** FK to prj_project.id for sub-projects (null for root projects). */
    private Long parentId;

    /** Planned project start date. */
    private LocalDate plannedStart;

    /** Planned project end date. */
    private LocalDate plannedEnd;
}
