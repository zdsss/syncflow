package com.syncflow.task.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Task status enumeration.
 * <p>
 * The {@code code} field is persisted to the database via {@link EnumValue}.
 */
@Getter
@AllArgsConstructor
public enum TaskStatus {

    PENDING(1, "未开始"),
    IN_PROGRESS(2, "进行中"),
    PENDING_REVIEW(3, "待审核"),
    COMPLETED(4, "已完成"),
    CANCELLED(5, "已取消"),
    ON_HOLD(6, "已暂停"),
    OVERDUE(7, "已延期");

    /** Integer value persisted to the database. */
    @EnumValue
    private final int code;

    /** Chinese display label. */
    @JsonValue
    private final String label;

    /**
     * Resolve a status from its integer code.
     *
     * @param code the database code
     * @return the matching status, or {@code null} if not found
     */
    public static TaskStatus fromCode(int code) {
        for (TaskStatus s : values()) {
            if (s.code == code) {
                return s;
            }
        }
        return null;
    }
}
