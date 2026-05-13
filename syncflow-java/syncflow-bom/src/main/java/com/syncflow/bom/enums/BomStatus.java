package com.syncflow.bom.enums;

import lombok.Getter;

/**
 * BOM status codes.
 */
@Getter
public enum BomStatus {

    EDITING(1, "编辑中"),
    PENDING_APPROVAL(2, "待审批"),
    PUBLISHED(3, "已发布"),
    LOCKED(4, "已锁定"),
    CANCELLED(5, "已废止");

    private final int code;
    private final String label;

    BomStatus(int code, String label) {
        this.code = code;
        this.label = label;
    }

    public static BomStatus fromCode(int code) {
        for (BomStatus s : values()) {
            if (s.code == code) {
                return s;
            }
        }
        throw new IllegalArgumentException("Unknown BomStatus code: " + code);
    }
}
