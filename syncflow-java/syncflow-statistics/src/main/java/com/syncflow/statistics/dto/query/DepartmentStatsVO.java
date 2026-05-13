package com.syncflow.statistics.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Department statistics view object.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentStatsVO {

    private Long departmentId;
    private String departmentName;
    private long totalMembers;
    private long totalTasks;
    private long completedTasks;
    private long overdueTasks;
    private List<UserWorkloadVO> members;
}
