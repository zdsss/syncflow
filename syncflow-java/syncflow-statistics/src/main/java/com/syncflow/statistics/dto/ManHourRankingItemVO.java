package com.syncflow.statistics.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Single man-hour ranking item.
 */
@Data
public class ManHourRankingItemVO {

    /** User ID. */
    private Long userId;

    /** User display name. */
    private String userName;

    /** Total logged hours. */
    private BigDecimal hours;

    /** Numeric rank position. */
    private Integer ranking;
}
