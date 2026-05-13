package com.syncflow.common.dto.knowledge;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating a knowledge article.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateArticleDTO {

    @NotBlank(message = "Article title is required")
    private String title;

    private String content;
    private String category;
    private String tags;
}
