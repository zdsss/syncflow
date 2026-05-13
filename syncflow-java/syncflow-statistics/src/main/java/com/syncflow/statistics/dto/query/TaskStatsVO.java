package com.syncflow.statistics.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Task statistics view object for query service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatsVO {

    private long totalTasks;
    private long completedTasks;
    private long overdueTasks;
    private long inProgressTasks;
    private long pendingTasks;
    private Map<String, Long> byType;
    private Map<String, Long> byPriority;
}
