package com.syncflow.statistics.dto;

import lombok.Data;

import java.util.List;

@Data
public class FrontendDashboardVO {

    private long activeProjects;
    private long completedTasks;
    private long overdueTasks;
    private long risks;
    private long currentTasks;
    private long nextTasks;
    private long inTransitIssues;
    private List<HoursRankingItem> hoursRanking;
    private List<OnTimeRateItem> onTimeRate;

    @Data
    public static class HoursRankingItem {
        private String name;
        private double hours;
    }

    @Data
    public static class OnTimeRateItem {
        private String name;
        private double rate;
    }
}
