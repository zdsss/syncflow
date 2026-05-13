package com.syncflow.process.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("prc_route_version")
public class RouteVersion {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long routeId;

    private String version;

    private String description;

    private String snapshotJson;

    private Long createdBy;

    private LocalDateTime createdAt;
}
