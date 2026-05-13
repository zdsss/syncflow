package com.syncflow.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Update user status request DTO
 */
@Data
public class UpdateUserStatusDTO {

    @NotNull(message = "Status cannot be null")
    private Integer status;
}
