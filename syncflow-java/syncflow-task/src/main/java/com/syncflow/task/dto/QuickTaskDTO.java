package com.syncflow.task.dto;

import lombok.Data;

/**
 * Quick task creation input.
 * <p>
 * Supports compact format: {@code "任务名,@人#工时¥工期%类型"}
 * <ul>
 *   <li>{@code @人}   -- assignee mention</li>
 *   <li>{@code #工时}  -- planned hours</li>
 *   <li>{@code ¥工期}  -- planned days</li>
 *   <li>{@code %类型}  -- task type</li>
 * </ul>
 */
@Data
public class QuickTaskDTO {

    /**
     * Compact task string, e.g. {@code "完成模块设计,@张三#8¥2%TASK"}.
     */
    private String input;

    /** Project to attach the task to. */
    private Long projectId;
}
