package com.syncflow.common.dto.personal;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating a personal file entry.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePersonalFileDTO {

    @NotBlank(message = "File name is required")
    private String name;

    private String filePath;
    private Long size;
}
