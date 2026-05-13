package com.syncflow.statistics.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Project statistics view object for query service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectStatsVO {

    private long totalProjects;
    private long activeProjects;
    private long completedProjects;
    private long delayedProjects;
    private Map<String, Long> byType;
    private Map<String, Long> byDepartment;
}
