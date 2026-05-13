package com.syncflow.common.service.knowledge;

import com.syncflow.common.dto.knowledge.*;
import com.syncflow.common.result.PageResult;

import java.util.List;

/**
 * Knowledge base service interface.
 */
public interface KnowledgeService {

    /**
     * Get all distinct categories with article counts.
     */
    List<CategoryVO> getCategories();

    /**
     * Get articles by category.
     */
    List<ArticleVO> getArticlesByCategory(String category);

    /**
     * Paginated article list with optional keyword filter.
     */
    PageResult<ArticleVO> getArticleList(String keyword, String category, int pageNum, int pageSize);

    /**
     * Get article detail by id (increments view count).
     */
    ArticleVO getArticleDetail(Long id);

    /**
     * Create a new article.
     */
    ArticleVO createArticle(CreateArticleDTO dto);

    /**
     * Update an existing article.
     */
    ArticleVO updateArticle(Long id, CreateArticleDTO dto);

    /**
     * Delete an article (soft delete).
     */
    void deleteArticle(Long id);

    /**
     * Get comments for an article.
     */
    PageResult<ArticleCommentVO> getComments(Long articleId, int pageNum, int pageSize);

    /**
     * Add a comment to an article.
     */
    ArticleCommentVO addComment(Long articleId, CreateArticleCommentDTO dto);
}
