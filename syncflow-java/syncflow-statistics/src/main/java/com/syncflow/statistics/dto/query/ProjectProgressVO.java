package com.syncflow.statistics.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Project progress view object.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectProgressVO {

    private Long projectId;
    private String projectName;
    private Integer progress;
    private long totalTasks;
    private long completedTasks;
    private long overdueTasks;
    private BigDecimal plannedHours;
    private BigDecimal actualHours;
}
