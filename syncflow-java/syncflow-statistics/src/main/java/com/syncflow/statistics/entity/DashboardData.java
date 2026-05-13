package com.syncflow.statistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Dashboard pre-calculated data entity.
 * <p>
 * Maps to the {@code sta_dashboard_data} table.
 */
@Data
@TableName("sta_dashboard_data")
public class DashboardData {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to prj_project.id. */
    private Long projectId;

    /** Data type category, e.g. COMPLETED_TASKS, OVERDUE_TASKS. */
    private String dataType;

    /** Calculated metric value. */
    private BigDecimal value;

    /** Dimension category for grouping. */
    private String dimension;

    /** Specific dimension value. */
    private String dimensionValue;

    /** Timestamp when this data was calculated. */
    private LocalDateTime calculatedAt;
}
