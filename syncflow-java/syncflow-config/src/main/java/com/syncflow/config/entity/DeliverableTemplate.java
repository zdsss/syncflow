package com.syncflow.config.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Deliverable checklist template.
 * <p>
 * Maps to the {@code cfg_deliverable_template} table.
 * Items are stored as a JSONB array: [{name, required, fileType}, ...]
 */
@Data
@TableName("cfg_deliverable_template")
public class DeliverableTemplate {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long tenantId;

    private String name;

    private String description;

    /** JSON array of deliverable items. */
    private String itemsJson;

    private Long createdBy;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
