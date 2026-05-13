package com.syncflow.common.dto.knowledge;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating a comment on a knowledge article.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateArticleCommentDTO {

    @NotBlank(message = "Comment content is required")
    private String content;

    private Long parentId;
}
