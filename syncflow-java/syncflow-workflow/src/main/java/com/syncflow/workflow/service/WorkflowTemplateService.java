package com.syncflow.workflow.service;

import com.syncflow.workflow.entity.WorkflowTemplate;

import java.util.List;

public interface WorkflowTemplateService {
    List<WorkflowTemplate> listTemplates(Long tenantId);
    WorkflowTemplate getTemplate(Long templateId);
    WorkflowTemplate createTemplate(WorkflowTemplate template);
    WorkflowTemplate updateTemplate(Long templateId, WorkflowTemplate template);
    void deleteTemplate(Long templateId);
}
