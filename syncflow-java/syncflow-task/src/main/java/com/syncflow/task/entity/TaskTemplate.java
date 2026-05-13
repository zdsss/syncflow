package com.syncflow.task.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Reusable task template with optional sub-task definitions.
 * <p>
 * Maps to the {@code tsk_task_template} table.
 */
@Data
@TableName("tsk_task_template")
public class TaskTemplate {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long tenantId;

    private String name;

    private String description;

    /** Scope: PERSONAL (user-specific) or GLOBAL (admin-defined). */
    private String scope;

    private Long creatorId;

    private Boolean isDefault;

    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
