package com.syncflow.common.service.resource.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.dto.search.SearchResultVO;
import com.syncflow.common.dto.search.SearchResultVO.SearchItemVO;
import com.syncflow.common.entity.knowledge.Article;
import com.syncflow.common.entity.resource.Resource;
import com.syncflow.common.entity.template.Template;
import com.syncflow.common.mapper.knowledge.ArticleMapper;
import com.syncflow.common.mapper.resource.ResourceMapper;
import com.syncflow.common.mapper.template.TemplateMapper;
import com.syncflow.common.service.resource.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Global search service implementation.
 * <p>
 * Searches across articles, templates, and resources.
 * Task and project search requires cross-module joins and is delegated
 * to the respective modules in the future.
 */
@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private final ArticleMapper articleMapper;
    private final TemplateMapper templateMapper;
    private final ResourceMapper resourceMapper;

    @Override
    public SearchResultVO search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return SearchResultVO.builder()
                    .tasks(Collections.emptyList())
                    .projects(Collections.emptyList())
                    .articles(Collections.emptyList())
                    .templates(Collections.emptyList())
                    .resources(Collections.emptyList())
                    .build();
        }

        String likePattern = "%" + keyword + "%";

        // Search articles
        LambdaQueryWrapper<Article> articleWrapper = new LambdaQueryWrapper<>();
        articleWrapper.like(Article::getTitle, keyword)
                      .or()
                      .like(Article::getContent, keyword)
                      .last("LIMIT 10");
        List<SearchItemVO> articles = articleMapper.selectList(articleWrapper).stream()
                .map(a -> SearchItemVO.builder()
                        .id(a.getId())
                        .title(a.getTitle())
                        .type("ARTICLE")
                        .summary(truncate(a.getContent(), 100))
                        .url("/knowledge/" + a.getId())
                        .build())
                .collect(Collectors.toList());

        // Search templates
        LambdaQueryWrapper<Template> templateWrapper = new LambdaQueryWrapper<>();
        templateWrapper.like(Template::getName, keyword)
                       .or()
                       .like(Template::getDescription, keyword)
                       .last("LIMIT 10");
        List<SearchItemVO> templates = templateMapper.selectList(templateWrapper).stream()
                .map(t -> SearchItemVO.builder()
                        .id(t.getId())
                        .title(t.getName())
                        .type("TEMPLATE")
                        .summary(truncate(t.getDescription(), 100))
                        .url("/templates/" + t.getId())
                        .build())
                .collect(Collectors.toList());

        // Search resources
        LambdaQueryWrapper<Resource> resourceWrapper = new LambdaQueryWrapper<>();
        resourceWrapper.like(Resource::getName, keyword)
                       .or()
                       .like(Resource::getDescription, keyword)
                       .last("LIMIT 10");
        List<SearchItemVO> resources = resourceMapper.selectList(resourceWrapper).stream()
                .map(r -> SearchItemVO.builder()
                        .id(r.getId())
                        .title(r.getName())
                        .type("RESOURCE")
                        .summary(truncate(r.getDescription(), 100))
                        .url("/resources/" + r.getId())
                        .build())
                .collect(Collectors.toList());

        return SearchResultVO.builder()
                .tasks(Collections.emptyList())
                .projects(Collections.emptyList())
                .articles(articles)
                .templates(templates)
                .resources(resources)
                .build();
    }

    private String truncate(String text, int maxLength) {
        if (text == null) {
            return null;
        }
        return text.length() > maxLength ? text.substring(0, maxLength) + "..." : text;
    }
}
