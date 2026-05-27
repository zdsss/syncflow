package com.syncflow.project.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProjectVO {

    private Long id;

    private String name;

    private String code;

    private String description;

    private Long ownerId;

    private String ownerName;

    private String projectType;

    @JsonProperty("type")
    public String getType() {
        return projectType;
    }

    private Integer status;

    private Integer priority;

    private Integer progress;

    private LocalDate plannedStart;

    private LocalDate plannedEnd;

    private LocalDate actualStart;

    private LocalDate actualEnd;

    private Long parentId;

    private String parentPath;

    private Long deptId;

    private String flowInstanceId;

    private Long tenantId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private List<ProjectVO> children;

    // ---- Frontend-aligned fields ----

    private List<AssigneeVO> assignees;

    private List<ProjectStageVO> stages;

    private String plannedHours;

    private String feedbackHours;

    private String approvedHours;

    private String plannedDuration;

    private String archiveLocation;

    private List<AttachmentVO> attachments;

    @Data
    public static class ProjectStageVO {
        private String id;
        private String name;
        private Integer progress;
        private String startDate;
        private String endDate;
        private List<ProjectStageVO> children;
        private List<TaskSummaryVO> tasks;
    }

    @Data
    public static class TaskSummaryVO {
        private String id;
        private String name;
        private String type;
        private Integer progress;
        private String status;
    }

    @Data
    public static class AttachmentVO {
        private String id;
        private String name;
        private String size;
        private String date;
        private String status;
        private String operator;
    }

    @Data
    public static class AssigneeVO {
        private String id;
        private String name;
        private String phone;
        private String avatar;
        private String department;
    }
}
