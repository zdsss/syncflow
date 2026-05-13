package com.syncflow.common.service.template.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.common.dto.template.CreateTemplateDTO;
import com.syncflow.common.dto.template.TemplateVO;
import com.syncflow.common.entity.template.Template;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.mapper.template.TemplateMapper;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.service.template.TemplateService;
import com.syncflow.common.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Template service implementation.
 */
@Service
@RequiredArgsConstructor
public class TemplateServiceImpl implements TemplateService {

    private final TemplateMapper templateMapper;

    @Override
    public PageResult<TemplateVO> getTemplateList(String keyword, int pageNum, int pageSize) {
        Page<Template> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Template> wrapper = new LambdaQueryWrapper<>();

        if (keyword != null && !keyword.isBlank()) {
            wrapper.like(Template::getName, keyword)
                   .or()
                   .like(Template::getDescription, keyword);
        }
        wrapper.orderByDesc(Template::getCreatedAt);

        IPage<Template> result = templateMapper.selectPage(page, wrapper);
        List<TemplateVO> voList = result.getRecords().stream()
                .map(this::toTemplateVO)
                .collect(Collectors.toList());
        return new PageResult<>(voList, result.getTotal(), result.getSize(), result.getCurrent());
    }

    @Override
    public TemplateVO getTemplateDetail(Long id) {
        Template template = getTemplateOrThrow(id);
        return toTemplateVO(template);
    }

    @Override
    @Transactional
    public TemplateVO createTemplate(CreateTemplateDTO dto) {
        Long currentUserId = SecurityUtils.getUserId();

        Template template = new Template();
        template.setName(dto.getName());
        template.setDescription(dto.getDescription());
        template.setType(dto.getType());
        template.setContent(dto.getContent());
        template.setCategory(dto.getCategory());
        template.setCreatorId(currentUserId);
        template.setUsageCount(0);

        templateMapper.insert(template);
        return toTemplateVO(template);
    }

    @Override
    @Transactional
    public TemplateVO updateTemplate(Long id, CreateTemplateDTO dto) {
        Template template = getTemplateOrThrow(id);

        template.setName(dto.getName());
        template.setDescription(dto.getDescription());
        template.setType(dto.getType());
        template.setContent(dto.getContent());
        template.setCategory(dto.getCategory());

        templateMapper.updateById(template);
        return toTemplateVO(template);
    }

    @Override
    @Transactional
    public void deleteTemplate(Long id) {
        getTemplateOrThrow(id);
        templateMapper.deleteById(id);
    }

    @Override
    public TemplateVO previewTemplate(Long id) {
        Template template = getTemplateOrThrow(id);
        return toTemplateVO(template);
    }

    @Override
    @Transactional
    public void applyTemplate(Long id) {
        Template template = getTemplateOrThrow(id);
        template.setUsageCount(template.getUsageCount() != null ? template.getUsageCount() + 1 : 1);
        templateMapper.updateById(template);
    }

    @Override
    @Transactional
    public TemplateVO duplicateTemplate(Long id) {
        Template original = getTemplateOrThrow(id);
        Long currentUserId = SecurityUtils.getUserId();

        Template copy = new Template();
        copy.setName(original.getName() + " (Copy)");
        copy.setDescription(original.getDescription());
        copy.setType(original.getType());
        copy.setContent(original.getContent());
        copy.setCategory(original.getCategory());
        copy.setCreatorId(currentUserId);
        copy.setUsageCount(0);

        templateMapper.insert(copy);
        return toTemplateVO(copy);
    }

    @Override
    public String exportTemplate(Long id) {
        Template template = getTemplateOrThrow(id);
        return template.getContent();
    }

    @Override
    @Transactional
    public TemplateVO importTemplate(String templateJson) {
        Long currentUserId = SecurityUtils.getUserId();

        Template template = new Template();
        template.setName("Imported Template");
        template.setContent(templateJson);
        template.setCreatorId(currentUserId);
        template.setUsageCount(0);

        templateMapper.insert(template);
        return toTemplateVO(template);
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    private Template getTemplateOrThrow(Long id) {
        Template template = templateMapper.selectById(id);
        if (template == null) {
            throw new BusinessException(ErrorCode.TEMPLATE_NOT_FOUND);
        }
        return template;
    }

    private TemplateVO toTemplateVO(Template template) {
        return TemplateVO.builder()
                .id(template.getId())
                .name(template.getName())
                .description(template.getDescription())
                .type(template.getType())
                .content(template.getContent())
                .category(template.getCategory())
                .creatorId(template.getCreatorId())
                .usageCount(template.getUsageCount())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }
}
