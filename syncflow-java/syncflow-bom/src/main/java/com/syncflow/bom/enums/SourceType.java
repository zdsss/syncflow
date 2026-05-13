package com.syncflow.bom.enums;

import lombok.Getter;

/**
 * BOM item source type.
 */
@Getter
public enum SourceType {

    MADE("MADE", "自制"),
    PURCHASED("PURCHASED", "外购"),
    SUBCONTRACT("SUBCONTRACT", "委外");

    private final String code;
    private final String label;

    SourceType(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public static SourceType fromCode(String code) {
        for (SourceType s : values()) {
            if (s.code.equals(code)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Unknown SourceType code: " + code);
    }
}
