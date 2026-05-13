package com.syncflow.task.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO for changing a task's status.
 */
@Data
public class ChangeStatusDTO {

    @NotNull(message = "状态值不能为空")
    private Integer status;
}
