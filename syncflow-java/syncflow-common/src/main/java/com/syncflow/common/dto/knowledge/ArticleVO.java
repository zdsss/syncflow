package com.syncflow.common.dto.knowledge;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Knowledge article detail view object.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleVO {

    private Long id;
    private String title;
    private String content;
    private String category;
    private Long authorId;
    private String authorName;
    private String tags;
    private Integer viewCount;
    private Integer commentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
