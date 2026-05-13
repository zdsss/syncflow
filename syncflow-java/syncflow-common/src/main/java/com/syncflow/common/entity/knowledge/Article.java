package com.syncflow.common.entity.knowledge;

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
 * Knowledge base article entity.
 * Maps to table {@code kng_article}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("kng_article")
public class Article implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** Article title. */
    private String title;

    /** Article content (rich text). */
    private String content;

    /** Article category for grouping. */
    private String category;

    /** FK to sys_user.id, article author. */
    private Long authorId;

    /** Comma-separated tags. */
    private String tags;

    /** View counter. */
    private Integer viewCount;

    /** Tenant identifier for multi-tenancy. */
    private Long tenantId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
