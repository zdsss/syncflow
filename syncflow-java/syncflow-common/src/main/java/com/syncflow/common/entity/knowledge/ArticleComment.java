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
 * Knowledge article comment entity.
 * Maps to table {@code kng_article_comment}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("kng_article_comment")
public class ArticleComment implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** FK to kng_article.id. */
    private Long articleId;

    /** FK to sys_user.id, comment author. */
    private Long authorId;

    /** Comment text content. */
    private String content;

    /** FK to kng_article_comment.id for reply threading. */
    private Long parentId;

    /** Tenant identifier for multi-tenancy. */
    private Long tenantId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
