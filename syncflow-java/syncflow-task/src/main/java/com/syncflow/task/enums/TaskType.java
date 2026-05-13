package com.syncflow.task.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Task type enumeration.
 * <p>
 * Maps to the {@code type} column in {@code tsk_task}.
 */
@Getter
@AllArgsConstructor
public enum TaskType {

    TASK("TASK", "任务"),
    MILESTONE("MILESTONE", "里程碑"),
    ISSUE("ISSUE", "问题"),
    RISK("RISK", "风险"),
    SUGGESTION("SUGGESTION", "建议"),
    CHANGE("CHANGE", "变更"),
    ACTIVITY("ACTIVITY", "活动"),
    STAGE("STAGE", "阶段"),
    APPROVAL("APPROVAL", "审批");

    /** String value persisted to the database. */
    private final String code;

    /** Chinese display label. */
    private final String label;
}
