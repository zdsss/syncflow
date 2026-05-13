package com.syncflow.common.entity.resource;

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
 * Resource entity for tools, terminology, and shared references.
 * Maps to table {@code res_resource}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("res_resource")
public class Resource implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** Resource name. */
    private String name;

    /** Resource type: TOOL, TERMINOLOGY, REFERENCE, etc. */
    private String type;

    /** Resource description. */
    private String description;

    /** Resource status: 1=active, 0=inactive. */
    private Integer status;

    /** Extended content stored as JSON. */
    private String content;

    /** Tenant identifier for multi-tenancy. */
    private Long tenantId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
