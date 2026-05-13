package com.syncflow.process.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RouteVersionVO {
    private Long id;
    private Long routeId;
    private String version;
    private String description;
    private String status;
    private LocalDateTime createdAt;
}
