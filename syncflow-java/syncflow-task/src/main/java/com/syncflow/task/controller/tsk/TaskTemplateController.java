package com.syncflow.task.controller.tsk;

import com.syncflow.common.result.Result;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.task.entity.TaskTemplate;
import com.syncflow.task.entity.TaskTemplateItem;
import com.syncflow.task.service.TaskTemplateService;
import lombok.Data;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Task template management controller.
 */
@RestController
@RequestMapping("/api/task-templates")
public class TaskTemplateController {

    private final TaskTemplateService taskTemplateService;

    public TaskTemplateController(TaskTemplateService taskTemplateService) {
        this.taskTemplateService = taskTemplateService;
    }

    /**
     * List task templates. Defaults to current user if userId not specified.
     */
    @GetMapping
    public Result<List<TaskTemplate>> listTemplates(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String scope) {
        if (userId == null) {
            userId = SecurityUtils.tryGetUserId();
        }
        List<TaskTemplate> templates = taskTemplateService.listTemplates(userId, scope);
        return Result.success(templates);
    }

    /**
     * Get template detail by id.
     */
    @GetMapping("/{id}")
    public Result<TaskTemplate> getTemplate(@PathVariable Long id) {
        TaskTemplate template = taskTemplateService.getTemplateDetail(id);
        return Result.success(template);
    }

    /**
     * Create a new task template with items.
     */
    @PostMapping
    public Result<TaskTemplate> createTemplate(@RequestBody CreateTemplateRequest request) {
        TaskTemplate template = new TaskTemplate();
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setScope(request.getScope());
        template.setCreatorId(SecurityUtils.tryGetUserId());

        List<TaskTemplateItem> items = mapItems(request.getItems());
        TaskTemplate created = taskTemplateService.createTemplate(template, items);
        return Result.success(created);
    }

    /**
     * Update an existing task template.
     */
    @PutMapping("/{id}")
    public Result<TaskTemplate> updateTemplate(@PathVariable Long id,
                                                @RequestBody UpdateTemplateRequest request) {
        TaskTemplate template = new TaskTemplate();
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setScope(request.getScope());

        List<TaskTemplateItem> items = mapItems(request.getItems());
        TaskTemplate updated = taskTemplateService.updateTemplate(id, template, items);
        return Result.success(updated);
    }

    /**
     * Delete a task template.
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteTemplate(@PathVariable Long id) {
        Long userId = SecurityUtils.tryGetUserId();
        taskTemplateService.deleteTemplate(id, userId);
        return Result.success();
    }

    // -----------------------------------------------------------------------
    //  Helper
    // -----------------------------------------------------------------------

    private List<TaskTemplateItem> mapItems(List<ItemDTO> itemDTOs) {
        if (itemDTOs == null) {
            return List.of();
        }
        return itemDTOs.stream().map(dto -> {
            TaskTemplateItem item = new TaskTemplateItem();
            item.setTitle(dto.getTitle());
            item.setType(dto.getType());
            item.setSortOrder(dto.getSortOrder());
            item.setParentItemId(dto.getParentItemId());
            return item;
        }).toList();
    }

    // -----------------------------------------------------------------------
    //  DTOs
    // -----------------------------------------------------------------------

    @Data
    public static class CreateTemplateRequest {
        private String name;
        private String description;
        private String scope;
        private List<ItemDTO> items;
    }

    @Data
    public static class UpdateTemplateRequest {
        private String name;
        private String description;
        private String scope;
        private List<ItemDTO> items;
    }

    @Data
    public static class ItemDTO {
        private String title;
        private String type;
        private Integer sortOrder;
        private Long parentItemId;
    }
}
