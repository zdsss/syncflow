package com.syncflow.process.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

/**
 * DTO for creating or updating an operation.
 */
@Data
public class CreateOperationDTO {

    @NotBlank(message = "工序名称不能为空")
    private String name;

    private String description;

    private String materialCode;

    private String materialName;

    private String drawingNo;

    /** Source type: SELF_MADE, OUTSOURCED, PURCHASED. */
    private String sourceType;

    private Boolean isVirtual;

    private String workCenterCode;

    private String workCenterName;

    /** Man-hour entries for this operation. */
    private List<CreateManHourDTO> manHours;
}
