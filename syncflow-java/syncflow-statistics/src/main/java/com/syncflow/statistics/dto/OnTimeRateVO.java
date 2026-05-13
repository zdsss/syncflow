package com.syncflow.statistics.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * On-time completion rate per user.
 */
@Data
public class OnTimeRateVO {

    /** User ID. */
    private Long userId;

    /** User display name. */
    private String userName;

    /** Total tasks assigned to this user. */
    private Integer totalTasks;

    /** Tasks completed on or before due date. */
    private Integer onTimeTasks;

    /** On-time rate as a percentage (0-100). */
    private BigDecimal rate;
}
