package com.syncflow.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * Assign permissions to role request DTO
 */
@Data
public class PermissionAssignDTO {

    @NotNull(message = "Permission IDs cannot be null")
    private List<Long> permissionIds;
}
