package com.syncflow.task.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.task.entity.TaskTemplate;
import com.syncflow.task.entity.TaskTemplateItem;
import com.syncflow.task.mapper.TaskTemplateItemMapper;
import com.syncflow.task.mapper.TaskTemplateMapper;
import com.syncflow.task.service.TaskTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskTemplateServiceImpl implements TaskTemplateService {

    private final TaskTemplateMapper taskTemplateMapper;
    private final TaskTemplateItemMapper taskTemplateItemMapper;

    @Override
    public List<TaskTemplate> listTemplates(Long userId, String scope) {
        LambdaQueryWrapper<TaskTemplate> wrapper = new LambdaQueryWrapper<>();
        if (scope == null) {
            // Return both PERSONAL (for this user) and GLOBAL
            wrapper.and(w -> w
                    .eq(TaskTemplate::getScope, "GLOBAL")
                    .or()
                    .and(inner -> inner
                            .eq(TaskTemplate::getScope, "PERSONAL")
                            .eq(TaskTemplate::getCreatorId, userId)
                    )
            );
        } else {
            wrapper.eq(TaskTemplate::getScope, scope);
            if ("PERSONAL".equals(scope)) {
                wrapper.eq(TaskTemplate::getCreatorId, userId);
            }
        }
        wrapper.orderByAsc(TaskTemplate::getSortOrder);
        return taskTemplateMapper.selectList(wrapper);
    }

    @Override
    public TaskTemplate getTemplateDetail(Long templateId) {
        TaskTemplate template = taskTemplateMapper.selectById(templateId);
        if (template == null) {
            throw new BusinessException(ErrorCode.TASK_TEMPLATE_NOT_FOUND);
        }
        return template;
    }

    @Override
    @Transactional
    public TaskTemplate createTemplate(TaskTemplate template, List<TaskTemplateItem> items) {
        taskTemplateMapper.insert(template);
        if (items != null) {
            for (TaskTemplateItem item : items) {
                item.setTemplateId(template.getId());
                taskTemplateItemMapper.insert(item);
            }
        }
        return template;
    }

    @Override
    @Transactional
    public TaskTemplate updateTemplate(Long templateId, TaskTemplate template, List<TaskTemplateItem> items) {
        TaskTemplate existing = taskTemplateMapper.selectById(templateId);
        if (existing == null) {
            throw new BusinessException(ErrorCode.TASK_TEMPLATE_NOT_FOUND);
        }
        template.setId(templateId);
        taskTemplateMapper.updateById(template);

        // Delete old items and insert new ones
        LambdaQueryWrapper<TaskTemplateItem> deleteWrapper = new LambdaQueryWrapper<>();
        deleteWrapper.eq(TaskTemplateItem::getTemplateId, templateId);
        taskTemplateItemMapper.delete(deleteWrapper);

        if (items != null) {
            for (TaskTemplateItem item : items) {
                item.setId(null);
                item.setTemplateId(templateId);
                taskTemplateItemMapper.insert(item);
            }
        }
        return template;
    }

    @Override
    @Transactional
    public void deleteTemplate(Long templateId, Long userId) {
        TaskTemplate template = taskTemplateMapper.selectById(templateId);
        if (template == null) {
            throw new BusinessException(ErrorCode.TASK_TEMPLATE_NOT_FOUND);
        }
        if (!template.getCreatorId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Only the creator can delete this template");
        }
        // Delete items first
        LambdaQueryWrapper<TaskTemplateItem> deleteWrapper = new LambdaQueryWrapper<>();
        deleteWrapper.eq(TaskTemplateItem::getTemplateId, templateId);
        taskTemplateItemMapper.delete(deleteWrapper);

        taskTemplateMapper.deleteById(templateId);
    }
}
