package com.syncflow.common.dto.resource;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Resource view object.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceVO {

    private Long id;
    private String name;
    private String type;
    private String description;
    private Integer status;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
