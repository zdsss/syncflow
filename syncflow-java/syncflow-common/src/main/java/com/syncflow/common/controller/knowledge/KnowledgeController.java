package com.syncflow.common.controller.knowledge;

import com.syncflow.common.dto.knowledge.*;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.result.Result;
import com.syncflow.common.service.knowledge.KnowledgeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Knowledge base controller.
 */
@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    public KnowledgeController(KnowledgeService knowledgeService) {
        this.knowledgeService = knowledgeService;
    }

    /**
     * Get all article categories.
     */
    @GetMapping("/categories")
    public Result<List<CategoryVO>> getCategories() {
        List<CategoryVO> categories = knowledgeService.getCategories();
        return Result.success(categories);
    }

    /**
     * Get articles by category.
     */
    @GetMapping("/by-category/{category}")
    public Result<List<ArticleVO>> getArticlesByCategory(@PathVariable String category) {
        List<ArticleVO> articles = knowledgeService.getArticlesByCategory(category);
        return Result.success(articles);
    }

    /**
     * Paginated article list with optional filters.
     */
    @GetMapping
    public Result<PageResult<ArticleVO>> getArticleList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<ArticleVO> result = knowledgeService.getArticleList(keyword, category, pageNum, pageSize);
        return Result.success(result);
    }

    /**
     * Article detail (increments view count).
     */
    @GetMapping("/{id}")
    public Result<ArticleVO> getArticleDetail(@PathVariable Long id) {
        ArticleVO vo = knowledgeService.getArticleDetail(id);
        return Result.success(vo);
    }

    /**
     * Create a new article.
     */
    @PostMapping
    public Result<ArticleVO> createArticle(@Valid @RequestBody CreateArticleDTO dto) {
        ArticleVO vo = knowledgeService.createArticle(dto);
        return Result.success(vo);
    }

    /**
     * Update an article.
     */
    @PatchMapping("/{id}")
    public Result<ArticleVO> updateArticle(@PathVariable Long id,
                                           @Valid @RequestBody CreateArticleDTO dto) {
        ArticleVO vo = knowledgeService.updateArticle(id, dto);
        return Result.success(vo);
    }

    /**
     * Delete an article (soft delete).
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteArticle(@PathVariable Long id) {
        knowledgeService.deleteArticle(id);
        return Result.success();
    }

    /**
     * Get comments for an article.
     */
    @GetMapping("/{articleId}/comments")
    public Result<PageResult<ArticleCommentVO>> getComments(
            @PathVariable Long articleId,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<ArticleCommentVO> result = knowledgeService.getComments(articleId, pageNum, pageSize);
        return Result.success(result);
    }

    /**
     * Add a comment to an article.
     */
    @PostMapping("/{articleId}/comments")
    public Result<ArticleCommentVO> addComment(@PathVariable Long articleId,
                                               @Valid @RequestBody CreateArticleCommentDTO dto) {
        ArticleCommentVO vo = knowledgeService.addComment(articleId, dto);
        return Result.success(vo);
    }
}
