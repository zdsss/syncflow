package com.syncflow.common.entity.template;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Template entity for reusable project / task templates.
 * Maps to table {@code tpl_template}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("tpl_template")
public class Template implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** Template display name. */
    private String name;

    /** Template description. */
    private String description;

    /** Template type: PROJECT, TASK, etc. */
    private String type;

    /** Template content stored as JSON. */
    private String content;

    /** Template category for grouping. */
    private String category;

    /** FK to sys_user.id, template creator. */
    private Long creatorId;

    /** Number of times this template has been applied. */
    private Integer usageCount;

    /** Tenant identifier for multi-tenancy. */
    private Long tenantId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
