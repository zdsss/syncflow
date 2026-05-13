package com.syncflow.config.service;

import com.syncflow.config.entity.DeliverableTemplate;

import java.util.List;

public interface DeliverableTemplateService {
    List<DeliverableTemplate> listTemplates(Long tenantId);
    DeliverableTemplate getTemplate(Long templateId);
    DeliverableTemplate createTemplate(DeliverableTemplate template);
    DeliverableTemplate updateTemplate(Long templateId, DeliverableTemplate template);
    void deleteTemplate(Long templateId);
}
