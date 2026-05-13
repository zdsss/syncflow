package com.syncflow.workflow.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.workflow.entity.WorkflowTemplate;
import com.syncflow.workflow.mapper.WorkflowTemplateMapper;
import com.syncflow.workflow.service.WorkflowTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkflowTemplateServiceImpl implements WorkflowTemplateService {

    private final WorkflowTemplateMapper workflowTemplateMapper;

    @Override
    public List<WorkflowTemplate> listTemplates(Long tenantId) {
        LambdaQueryWrapper<WorkflowTemplate> wrapper = new LambdaQueryWrapper<>();
        if (tenantId != null) {
            wrapper.eq(WorkflowTemplate::getTenantId, tenantId);
        }
        wrapper.eq(WorkflowTemplate::getIsActive, true);
        wrapper.orderByAsc(WorkflowTemplate::getId);
        return workflowTemplateMapper.selectList(wrapper);
    }

    @Override
    public WorkflowTemplate getTemplate(Long templateId) {
        WorkflowTemplate template = workflowTemplateMapper.selectById(templateId);
        if (template == null) {
            throw new BusinessException(ErrorCode.WORKFLOW_TEMPLATE_NOT_FOUND);
        }
        return template;
    }

    @Override
    public WorkflowTemplate createTemplate(WorkflowTemplate template) {
        workflowTemplateMapper.insert(template);
        return template;
    }

    @Override
    public WorkflowTemplate updateTemplate(Long templateId, WorkflowTemplate template) {
        WorkflowTemplate existing = workflowTemplateMapper.selectById(templateId);
        if (existing == null) {
            throw new BusinessException(ErrorCode.WORKFLOW_TEMPLATE_NOT_FOUND);
        }
        template.setId(templateId);
        workflowTemplateMapper.updateById(template);
        return template;
    }

    @Override
    public void deleteTemplate(Long templateId) {
        WorkflowTemplate existing = workflowTemplateMapper.selectById(templateId);
        if (existing == null) {
            throw new BusinessException(ErrorCode.WORKFLOW_TEMPLATE_NOT_FOUND);
        }
        workflowTemplateMapper.deleteById(templateId);
    }
}
