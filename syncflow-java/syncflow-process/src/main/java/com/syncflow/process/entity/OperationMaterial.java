package com.syncflow.process.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Material entity associated with an operation.
 * <p>
 * Maps to the {@code prc_operation_material} table.
 */
@Data
@TableName("prc_operation_material")
public class OperationMaterial {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to prc_operation.id. */
    private Long operationId;

    /** Material code. */
    private String materialCode;

    /** Material name. */
    private String materialName;

    /** Material specification / model. */
    private String specification;

    /** Required quantity. */
    private BigDecimal quantity;

    /** Unit of measure, e.g. "kg", "pcs", "m". */
    private String unit;

    /** Loss rate as a decimal, e.g. 0.05 for 5%. */
    private BigDecimal lossRate;

    /** Optional remark. */
    private String remark;
}
