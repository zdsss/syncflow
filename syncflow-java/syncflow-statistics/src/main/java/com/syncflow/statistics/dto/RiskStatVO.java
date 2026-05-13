package com.syncflow.statistics.dto;

import lombok.Data;

/**
 * Risk-type task view object for dashboard risk list.
 */
@Data
public class RiskStatVO {

    /** Task ID. */
    private Long taskId;

    /** Task title. */
    private String title;

    /** Project display name. */
    private String projectName;

    /** Risk level derived from tags or priority. */
    private String riskLevel;

    /** Task description or summary. */
    private String description;
}
