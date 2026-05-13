package com.syncflow.process.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Man-hour entity for an operation.
 * <p>
 * Maps to the {@code prc_man_hour} table.
 */
@Data
@TableName("prc_man_hour")
public class ManHour {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to prc_operation.id. */
    private Long operationId;

    /** Work type, e.g. SETUP, PROCESSING, INSPECTION. */
    private String workType;

    /** Hours required. */
    private BigDecimal hours;

    /** Number of workers required. */
    private Integer workerCount;

    /** Whether this is a critical-path man-hour entry. */
    private Boolean isCritical;

    /** Optional remark. */
    private String remark;
}
