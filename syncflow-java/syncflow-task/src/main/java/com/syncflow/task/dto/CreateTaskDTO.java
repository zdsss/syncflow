package com.syncflow.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for creating a new task.
 */
@Data
public class CreateTaskDTO {

    @NotBlank(message = "任务标题不能为空")
    private String title;

    /** Task type: TASK, MILESTONE, ISSUE, RISK, SUGGESTION, CHANGE, ACTIVITY, STAGE, APPROVAL. */
    @NotBlank(message = "任务类型不能为空")
    private String type;

    @NotNull(message = "项目ID不能为空")
    private Long projectId;

    /** FK to sys_user.id, primary assignee. */
    private Long assigneeId;

    private String description;

    private LocalDate plannedStart;

    private LocalDate plannedEnd;

    private BigDecimal plannedHours;

    private Integer plannedDays;

    private LocalDate dueDate;

    /** Comma-separated tags. */
    private String tags;

    /** Priority: 1=URGENT, 2=HIGH, 3=MEDIUM, 4=LOW. Defaults to 3. */
    private Integer priority;

    /** FK to prj_phase.id, links task to a project phase. */
    private Long phaseId;

    /** FK to prj_milestone.id, links task to a milestone (triggers approval on completion). */
    private Long milestoneId;

    /** FK to tsk_task.id, parent task for sub-task hierarchy. */
    private Long parentId;
}
