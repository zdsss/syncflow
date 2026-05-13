package com.syncflow.statistics.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * User workload view object.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserWorkloadVO {

    private Long userId;
    private String userName;
    private long totalTasks;
    private long completedTasks;
    private long inProgressTasks;
    private long overdueTasks;
    private BigDecimal totalHours;
    private BigDecimal actualHours;
}
