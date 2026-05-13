package com.syncflow.workflow.controller;

import com.syncflow.common.result.Result;
import com.syncflow.common.util.TenantContext;
import com.syncflow.workflow.entity.WorkflowTemplate;
import com.syncflow.workflow.service.WorkflowTemplateService;
import lombok.Data;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Workflow template management controller.
 */
@RestController
@RequestMapping("/api/workflow/templates")
public class WorkflowTemplateController {

    private final WorkflowTemplateService workflowTemplateService;

    public WorkflowTemplateController(WorkflowTemplateService workflowTemplateService) {
        this.workflowTemplateService = workflowTemplateService;
    }

    /**
     * List workflow templates for the current tenant.
     */
    @GetMapping
    public Result<List<WorkflowTemplate>> listTemplates() {
        Long tenantId = TenantContext.getTenantId();
        List<WorkflowTemplate> templates = workflowTemplateService.listTemplates(tenantId);
        return Result.success(templates);
    }

    /**
     * Get template detail by id.
     */
    @GetMapping("/{id}")
    public Result<WorkflowTemplate> getTemplate(@PathVariable Long id) {
        WorkflowTemplate template = workflowTemplateService.getTemplate(id);
        return Result.success(template);
    }

    /**
     * Create a new workflow template.
     */
    @PostMapping
    public Result<WorkflowTemplate> createTemplate(@RequestBody CreateTemplateRequest request) {
        WorkflowTemplate template = new WorkflowTemplate();
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setBpmnProcessKey(request.getBpmnProcessKey());
        template.setDefaultAssigneeRule(request.getDefaultAssigneeRule());
        template.setConfigJson(request.getConfigJson());
        template.setIsActive(request.getIsActive());
        template.setTenantId(TenantContext.getTenantId());
        WorkflowTemplate created = workflowTemplateService.createTemplate(template);
        return Result.success(created);
    }

    /**
     * Update an existing workflow template.
     */
    @PutMapping("/{id}")
    public Result<WorkflowTemplate> updateTemplate(@PathVariable Long id,
                                                    @RequestBody UpdateTemplateRequest request) {
        WorkflowTemplate template = new WorkflowTemplate();
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setBpmnProcessKey(request.getBpmnProcessKey());
        template.setDefaultAssigneeRule(request.getDefaultAssigneeRule());
        template.setConfigJson(request.getConfigJson());
        template.setIsActive(request.getIsActive());
        WorkflowTemplate updated = workflowTemplateService.updateTemplate(id, template);
        return Result.success(updated);
    }

    /**
     * Delete a workflow template.
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteTemplate(@PathVariable Long id) {
        workflowTemplateService.deleteTemplate(id);
        return Result.success();
    }

    // -----------------------------------------------------------------------
    //  DTOs
    // -----------------------------------------------------------------------

    @Data
    public static class CreateTemplateRequest {
        private String name;
        private String description;
        private String bpmnProcessKey;
        private String defaultAssigneeRule;
        private String configJson;
        private Boolean isActive;
    }

    @Data
    public static class UpdateTemplateRequest {
        private String name;
        private String description;
        private String bpmnProcessKey;
        private String defaultAssigneeRule;
        private String configJson;
        private Boolean isActive;
    }
}
