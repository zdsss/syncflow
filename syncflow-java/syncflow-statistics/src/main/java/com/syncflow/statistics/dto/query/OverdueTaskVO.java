package com.syncflow.statistics.dto.query;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Overdue task view object.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverdueTaskVO {

    private Long taskId;
    private String taskNo;
    private String title;
    private String projectName;
    private String assigneeName;
    private LocalDate dueDate;
    private Integer priority;
    private Integer status;
    private Integer progress;
}
