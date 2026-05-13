package com.syncflow.statistics.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Pie chart data segment.
 */
@Data
public class PieChartDataVO {

    /** Segment label (e.g. user name). */
    private String name;

    /** Segment value (e.g. hours). */
    private BigDecimal value;

    /** Percentage of total (0-100). */
    private Integer percent;
}
