package com.syncflow.task.service;

import com.syncflow.task.entity.TaskTemplate;
import com.syncflow.task.entity.TaskTemplateItem;

import java.util.List;

public interface TaskTemplateService {
    List<TaskTemplate> listTemplates(Long userId, String scope);
    TaskTemplate getTemplateDetail(Long templateId);
    TaskTemplate createTemplate(TaskTemplate template, List<TaskTemplateItem> items);
    TaskTemplate updateTemplate(Long templateId, TaskTemplate template, List<TaskTemplateItem> items);
    void deleteTemplate(Long templateId, Long userId);
}
