package com.syncflow.task.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Sub-task definition within a task template.
 * <p>
 * Maps to the {@code tsk_task_template_item} table.
 */
@Data
@TableName("tsk_task_template_item")
public class TaskTemplateItem {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long templateId;

    private String title;

    /** Task type for the generated sub-task, defaults to TASK. */
    private String type;

    private Integer sortOrder;

    /** Parent item for nested template structures. */
    private Long parentItemId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;
}
