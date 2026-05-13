package com.syncflow.process.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Operation entity within a process route.
 * <p>
 * Maps to the {@code prc_operation} table.
 */
@Data
@TableName("prc_operation")
public class Operation {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to prc_process_route.id. */
    private Long routeId;

    /** Sequence number for ordering, e.g. 10, 20, 30. */
    private Integer seqNo;

    /** Auto-generated operation number, e.g. 0010, 0020. */
    private String operationNo;

    /** Operation name. */
    private String name;

    /** Detailed description of the operation. */
    private String description;

    /** Material code associated with this operation. */
    private String materialCode;

    /** Material name. */
    private String materialName;

    /** Drawing number reference. */
    private String drawingNo;

    /** Source type, e.g. SELF_MADE, OUTSOURCED, PURCHASED. */
    private String sourceType;

    /** Whether this is a virtual (non-physical) operation. */
    private Boolean isVirtual;

    /** FK to work_center.id. */
    private Long workCenterId;

    /** Work center code. */
    private String workCenterCode;

    /** Work center name. */
    private String workCenterName;

    /** 1=active, 0=disabled. */
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
