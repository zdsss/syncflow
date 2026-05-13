package com.syncflow.workflow.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Audit trail for changes to approval configuration (wf_approval_config).
 */
@Data
@TableName("wf_approval_config_audit")
public class ApprovalConfigAudit implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    private Long configId;

    /** CREATE, UPDATE, DELETE, ENABLE, DISABLE */
    private String action;

    private String fieldName;

    private String oldValue;

    private String newValue;

    private Long operatorId;

    private String operatorName;

    private LocalDateTime createdAt;
}
