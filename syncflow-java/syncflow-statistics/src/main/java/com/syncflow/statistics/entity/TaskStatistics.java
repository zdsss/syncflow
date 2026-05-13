package com.syncflow.statistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Aggregated task statistics per user per project per day.
 * <p>
 * Maps to the {@code sta_task_statistics} table.
 */
@Data
@TableName("sta_task_statistics")
public class TaskStatistics {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to prj_project.id. */
    private Long projectId;

    /** FK to sys_user.id. */
    private Long userId;

    /** The date this statistic snapshot represents. */
    private LocalDate statDate;

    /** Total number of tasks assigned. */
    private Integer totalTasks;

    /** Number of completed tasks. */
    private Integer completedTasks;

    /** Number of overdue tasks. */
    private Integer overdueTasks;

    /** Number of tasks in warning state. */
    private Integer warningTasks;

    /** Total planned hours. */
    private BigDecimal totalHours;

    /** Hours for completed tasks. */
    private BigDecimal completedHours;

    /** Count of ISSUE-type tasks. */
    private Integer issueCount;

    /** Count of RISK-type tasks. */
    private Integer riskCount;

    /** Count of MILESTONE-type tasks. */
    private Integer milestoneCount;

    /** Timestamp when this record was calculated. */
    private LocalDateTime calculatedAt;
}
