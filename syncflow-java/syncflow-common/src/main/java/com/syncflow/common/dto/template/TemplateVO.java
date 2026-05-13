package com.syncflow.common.dto.template;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Template detail view object.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemplateVO {

    private Long id;
    private String name;
    private String description;
    private String type;
    private String content;
    private String category;
    private Long creatorId;
    private String creatorName;
    private Integer usageCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
