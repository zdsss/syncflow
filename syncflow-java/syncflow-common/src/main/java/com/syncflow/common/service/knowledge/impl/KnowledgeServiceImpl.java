package com.syncflow.common.service.knowledge.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.common.dto.knowledge.*;
import com.syncflow.common.entity.knowledge.Article;
import com.syncflow.common.entity.knowledge.ArticleComment;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.mapper.knowledge.ArticleCommentMapper;
import com.syncflow.common.mapper.knowledge.ArticleMapper;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.service.knowledge.KnowledgeService;
import com.syncflow.common.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Knowledge base service implementation.
 */
@Service
@RequiredArgsConstructor
public class KnowledgeServiceImpl implements KnowledgeService {

    private final ArticleMapper articleMapper;
    private final ArticleCommentMapper articleCommentMapper;

    @Override
    public List<CategoryVO> getCategories() {
        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        wrapper.select(Article::getCategory)
               .groupBy(Article::getCategory);
        List<Article> categories = articleMapper.selectList(wrapper);

        return categories.stream()
                .filter(a -> a.getCategory() != null)
                .map(a -> {
                    LambdaQueryWrapper<Article> countWrapper = new LambdaQueryWrapper<>();
                    countWrapper.eq(Article::getCategory, a.getCategory());
                    long count = articleMapper.selectCount(countWrapper);
                    return CategoryVO.builder()
                            .category(a.getCategory())
                            .articleCount(count)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<ArticleVO> getArticlesByCategory(String category) {
        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Article::getCategory, category)
               .orderByDesc(Article::getCreatedAt);
        List<Article> articles = articleMapper.selectList(wrapper);
        return articles.stream().map(this::toArticleVO).collect(Collectors.toList());
    }

    @Override
    public PageResult<ArticleVO> getArticleList(String keyword, String category, int pageNum, int pageSize) {
        Page<Article> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Article> wrapper = new LambdaQueryWrapper<>();

        if (keyword != null && !keyword.isBlank()) {
            wrapper.and(w -> w.like(Article::getTitle, keyword)
                              .or()
                              .like(Article::getTags, keyword));
        }
        if (category != null && !category.isBlank()) {
            wrapper.eq(Article::getCategory, category);
        }
        wrapper.orderByDesc(Article::getCreatedAt);

        IPage<Article> result = articleMapper.selectPage(page, wrapper);
        List<ArticleVO> voList = result.getRecords().stream()
                .map(this::toArticleVO)
                .collect(Collectors.toList());
        return new PageResult<>(voList, result.getTotal(), result.getSize(), result.getCurrent());
    }

    @Override
    @Transactional
    public ArticleVO getArticleDetail(Long id) {
        Article article = getArticleOrThrow(id);
        // Increment view count
        article.setViewCount(article.getViewCount() != null ? article.getViewCount() + 1 : 1);
        articleMapper.updateById(article);
        return toArticleVO(article);
    }

    @Override
    @Transactional
    public ArticleVO createArticle(CreateArticleDTO dto) {
        Long currentUserId = SecurityUtils.getUserId();

        Article article = new Article();
        article.setTitle(dto.getTitle());
        article.setContent(dto.getContent());
        article.setCategory(dto.getCategory());
        article.setAuthorId(currentUserId);
        article.setTags(dto.getTags());
        article.setViewCount(0);

        articleMapper.insert(article);
        return toArticleVO(article);
    }

    @Override
    @Transactional
    public ArticleVO updateArticle(Long id, CreateArticleDTO dto) {
        Article article = getArticleOrThrow(id);

        article.setTitle(dto.getTitle());
        article.setContent(dto.getContent());
        article.setCategory(dto.getCategory());
        article.setTags(dto.getTags());

        articleMapper.updateById(article);
        return toArticleVO(article);
    }

    @Override
    @Transactional
    public void deleteArticle(Long id) {
        getArticleOrThrow(id);
        articleMapper.deleteById(id);
    }

    @Override
    public PageResult<ArticleCommentVO> getComments(Long articleId, int pageNum, int pageSize) {
        getArticleOrThrow(articleId);

        Page<ArticleComment> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<ArticleComment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ArticleComment::getArticleId, articleId)
               .orderByDesc(ArticleComment::getCreatedAt);

        IPage<ArticleComment> result = articleCommentMapper.selectPage(page, wrapper);
        List<ArticleCommentVO> voList = result.getRecords().stream()
                .map(this::toCommentVO)
                .collect(Collectors.toList());
        return new PageResult<>(voList, result.getTotal(), result.getSize(), result.getCurrent());
    }

    @Override
    @Transactional
    public ArticleCommentVO addComment(Long articleId, CreateArticleCommentDTO dto) {
        getArticleOrThrow(articleId);
        Long currentUserId = SecurityUtils.getUserId();

        ArticleComment comment = new ArticleComment();
        comment.setArticleId(articleId);
        comment.setAuthorId(currentUserId);
        comment.setContent(dto.getContent());
        comment.setParentId(dto.getParentId());

        articleCommentMapper.insert(comment);
        return toCommentVO(comment);
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    private Article getArticleOrThrow(Long id) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException(ErrorCode.ARTICLE_NOT_FOUND);
        }
        return article;
    }

    private ArticleVO toArticleVO(Article article) {
        ArticleVO vo = ArticleVO.builder()
                .id(article.getId())
                .title(article.getTitle())
                .content(article.getContent())
                .category(article.getCategory())
                .authorId(article.getAuthorId())
                .tags(article.getTags())
                .viewCount(article.getViewCount())
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .build();

        // Count comments
        LambdaQueryWrapper<ArticleComment> countWrapper = new LambdaQueryWrapper<>();
        countWrapper.eq(ArticleComment::getArticleId, article.getId());
        Long commentCount = articleCommentMapper.selectCount(countWrapper);
        vo.setCommentCount(commentCount != null ? commentCount.intValue() : 0);

        return vo;
    }

    private ArticleCommentVO toCommentVO(ArticleComment comment) {
        return ArticleCommentVO.builder()
                .id(comment.getId())
                .articleId(comment.getArticleId())
                .authorId(comment.getAuthorId())
                .content(comment.getContent())
                .parentId(comment.getParentId())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
