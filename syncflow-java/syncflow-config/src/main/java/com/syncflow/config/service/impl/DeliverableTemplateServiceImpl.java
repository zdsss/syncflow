package com.syncflow.config.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.config.entity.DeliverableTemplate;
import com.syncflow.config.mapper.DeliverableTemplateMapper;
import com.syncflow.config.service.DeliverableTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliverableTemplateServiceImpl implements DeliverableTemplateService {

    private final DeliverableTemplateMapper deliverableTemplateMapper;

    @Override
    public List<DeliverableTemplate> listTemplates(Long tenantId) {
        LambdaQueryWrapper<DeliverableTemplate> wrapper = new LambdaQueryWrapper<>();
        if (tenantId != null) {
            wrapper.eq(DeliverableTemplate::getTenantId, tenantId);
        }
        wrapper.orderByAsc(DeliverableTemplate::getId);
        return deliverableTemplateMapper.selectList(wrapper);
    }

    @Override
    public DeliverableTemplate getTemplate(Long templateId) {
        DeliverableTemplate template = deliverableTemplateMapper.selectById(templateId);
        if (template == null) {
            throw new BusinessException(ErrorCode.DELIVERABLE_TEMPLATE_NOT_FOUND);
        }
        return template;
    }

    @Override
    public DeliverableTemplate createTemplate(DeliverableTemplate template) {
        deliverableTemplateMapper.insert(template);
        return template;
    }

    @Override
    public DeliverableTemplate updateTemplate(Long templateId, DeliverableTemplate template) {
        DeliverableTemplate existing = deliverableTemplateMapper.selectById(templateId);
        if (existing == null) {
            throw new BusinessException(ErrorCode.DELIVERABLE_TEMPLATE_NOT_FOUND);
        }
        template.setId(templateId);
        deliverableTemplateMapper.updateById(template);
        return template;
    }

    @Override
    public void deleteTemplate(Long templateId) {
        DeliverableTemplate existing = deliverableTemplateMapper.selectById(templateId);
        if (existing == null) {
            throw new BusinessException(ErrorCode.DELIVERABLE_TEMPLATE_NOT_FOUND);
        }
        deliverableTemplateMapper.deleteById(templateId);
    }
}
