package com.syncflow.task.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Task dependency relationship (SS/SF/FS/FF).
 * <p>
 * Maps to the {@code tsk_task_dependency} table.
 */
@Data
@TableName("tsk_task_dependency")
public class TaskDependency {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long tenantId;

    /** The task that has the dependency (the dependent). */
    private Long taskId;

    /** The task that is depended upon. */
    private Long dependsOnTaskId;

    /** Dependency type: SS, SF, FS, FF. */
    private String dependencyType;

    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
