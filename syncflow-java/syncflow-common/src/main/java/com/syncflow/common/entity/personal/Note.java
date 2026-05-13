package com.syncflow.common.entity.personal;

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
 * Personal note entity for user note-taking.
 * Maps to table {@code prs_note}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("prs_note")
public class Note implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** Note title. */
    private String title;

    /** Note content (rich text). */
    private String content;

    /** FK to sys_user.id, note owner. */
    private Long userId;

    /** Comma-separated tags. */
    private String tags;

    /** Tenant identifier for multi-tenancy. */
    private Long tenantId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    @TableLogic
    private LocalDateTime deletedAt;
}
