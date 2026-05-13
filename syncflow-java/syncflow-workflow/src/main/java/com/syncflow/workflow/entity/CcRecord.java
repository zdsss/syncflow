package com.syncflow.workflow.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Carbon-copy (CC) record for approval notifications.
 * <p>
 * Users who are CC'd on an approval can view the approval details but are not
 * required to take action. Tracks read status for notification badges.
 */
@Data
@TableName("wf_cc_record")
public class CcRecord implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /** FK to wf_business_object.id. */
    private Long businessObjectId;

    /** FK to sys_user.id — the CC recipient. */
    private Long userId;

    /** Whether the CC recipient has read the approval. */
    private Boolean isRead;

    /** Timestamp when the CC recipient read the approval. */
    private LocalDateTime readAt;

    /** Row creation timestamp. */
    private LocalDateTime createdAt;
}
