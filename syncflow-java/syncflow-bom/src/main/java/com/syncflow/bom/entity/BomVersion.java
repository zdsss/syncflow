package com.syncflow.bom.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * BOM version history.
 * <p>
 * Maps to the {@code bom_version} table.
 */
@Data
@TableName("bom_version")
public class BomVersion {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to bom_bom.id. */
    private Long bomId;

    /** Version string (e.g. 1.0, 1.1). */
    private String version;

    /** Summary of changes in this version. */
    private String changeSummary;

    /** FK to sys_user.id who created this version. */
    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * JSON snapshot of BomItem list at this version point.
     * Null for legacy records created before snapshot feature was added.
     */
    private String snapshotJson;
}
