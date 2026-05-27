package com.syncflow.task.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.syncflow.admin.dto.UserVO;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TaskVO {

    private Long id;

    private String taskNo;

    private String title;

    private String description;

    private String type;

    private String typeName;

    private Long projectId;

    private Long phaseId;

    private Long milestoneId;

    private Long parentId;

    private String parentPath;

    private Integer status;

    @JsonProperty("statusLabel")
    public String getStatusLabel() {
        if (status == null) return "todo";
        return switch (status) {
            case 2 -> "in_progress";
            case 3, 4 -> "done";
            default -> "todo";
        };
    }

    private Integer priority;

    private Integer progress;

    private Long assigneeId;

    private Long reporterId;

    private LocalDate plannedStart;

    private LocalDate plannedEnd;

    private BigDecimal plannedHours;

    private Integer plannedDays;

    private LocalDate actualStart;

    private LocalDate actualEnd;

    private BigDecimal actualHours;

    private LocalDate dueDate;

    private Boolean isOverdue;

    private Boolean isWarning;

    private String tags;

    private String taskCategory;

    private String flowInstanceId;

    private String taskIdInFlow;

    private Integer commentCount;

    private Integer attachmentCount;

    private Integer watcherCount;

    // ---- Enriched display fields ----

    private String assigneeName;

    private String reporterName;

    private String projectName;

    private Boolean isWatching;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // ---- Frontend-aligned fields ----

    @JsonProperty("name")
    public String getName() {
        return title;
    }

    private List<UserVO> assignees;

    private String feedbackHours;

    private String approvedHours;

    private String plannedDuration;

    private String actualEndDisplay;

    private String reminder;

    private String archiveLocation;

    private List<TaskDependencyVO> dependencies;

    private List<TaskAttachmentVO> attachments;

    private Boolean isMilestone;

    @JsonProperty("isWatched")
    public Boolean getIsWatched() {
        return isWatching;
    }

    @Data
    public static class TaskDependencyVO {
        private String taskId;
        private String type;
    }

    @Data
    public static class TaskAttachmentVO {
        private String id;
        private String name;
        private String size;
        private String date;
        private String status;
        private String operator;
    }
}
