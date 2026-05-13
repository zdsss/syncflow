package com.syncflow.common.dto.knowledge;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Comment view object for knowledge articles.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleCommentVO {

    private Long id;
    private Long articleId;
    private Long authorId;
    private String authorName;
    private String content;
    private Long parentId;
    private LocalDateTime createdAt;
}
