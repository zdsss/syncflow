package com.syncflow.bom.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

/**
 * Version comparison result VO, containing added/removed/modified BOM item diffs.
 */
@Data
public class BomVersionCompareVO {

    private List<BomItemSnapshot> added;
    private List<BomItemSnapshot> removed;
    private List<ModifiedEntry> modified;

    /**
     * Flat snapshot of a BOM item for version comparison purposes.
     */
    @Data
    public static class BomItemSnapshot {
        private Long id;
        private String name;
        private String materialCode;
        private String specification;
        private String sourceType;
        private BigDecimal quantity;
        private String unitOfMeasure;
    }

    /**
     * A single changed field between two versions.
     */
    @Data
    public static class FieldChange {
        private String field;
        private String oldValue;
        private String newValue;
    }

    /**
     * A BOM item that exists in both versions but has field-level differences.
     */
    @Data
    public static class ModifiedEntry {
        private BomItemSnapshot item;
        private List<FieldChange> changes;
    }
}
