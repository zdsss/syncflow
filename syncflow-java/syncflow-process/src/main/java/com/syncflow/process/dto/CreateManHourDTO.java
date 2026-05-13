package com.syncflow.process.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO for creating a man-hour entry.
 */
@Data
public class CreateManHourDTO {

    /** Work type: SETUP, PROCESSING, INSPECTION. */
    private String workType;

    private BigDecimal hours;

    private Integer workerCount;

    private Boolean isCritical;

    private String remark;
}
