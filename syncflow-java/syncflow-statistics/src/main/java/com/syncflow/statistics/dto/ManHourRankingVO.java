package com.syncflow.statistics.dto;

import lombok.Data;

import java.util.List;

/**
 * Man-hour ranking aggregate with items and pie chart data.
 */
@Data
public class ManHourRankingVO {

    /** Top ranking items. */
    private List<ManHourRankingItemVO> items;

    /** Pie chart data for visualization. */
    private List<PieChartDataVO> pieData;
}
