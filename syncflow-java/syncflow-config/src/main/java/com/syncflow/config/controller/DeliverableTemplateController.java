package com.syncflow.config.controller;

import com.syncflow.common.result.Result;
import com.syncflow.common.util.TenantContext;
import com.syncflow.config.entity.DeliverableTemplate;
import com.syncflow.config.service.DeliverableTemplateService;
import lombok.Data;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Deliverable template management controller.
 */
@RestController
@RequestMapping("/api/config/deliverable-templates")
public class DeliverableTemplateController {

    private final DeliverableTemplateService deliverableTemplateService;

    public DeliverableTemplateController(DeliverableTemplateService deliverableTemplateService) {
        this.deliverableTemplateService = deliverableTemplateService;
    }

    /**
     * List deliverable templates for the current tenant.
     */
    @GetMapping
    public Result<List<DeliverableTemplate>> listTemplates() {
        Long tenantId = TenantContext.getTenantId();
        List<DeliverableTemplate> templates = deliverableTemplateService.listTemplates(tenantId);
        return Result.success(templates);
    }

    /**
     * Get template detail by id.
     */
    @GetMapping("/{id}")
    public Result<DeliverableTemplate> getTemplate(@PathVariable Long id) {
        DeliverableTemplate template = deliverableTemplateService.getTemplate(id);
        return Result.success(template);
    }

    /**
     * Create a new deliverable template.
     */
    @PostMapping
    public Result<DeliverableTemplate> createTemplate(@RequestBody CreateTemplateRequest request) {
        DeliverableTemplate template = new DeliverableTemplate();
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setItemsJson(request.getItemsJson());
        template.setTenantId(TenantContext.getTenantId());
        DeliverableTemplate created = deliverableTemplateService.createTemplate(template);
        return Result.success(created);
    }

    /**
     * Update an existing deliverable template.
     */
    @PutMapping("/{id}")
    public Result<DeliverableTemplate> updateTemplate(@PathVariable Long id,
                                                       @RequestBody UpdateTemplateRequest request) {
        DeliverableTemplate template = new DeliverableTemplate();
        template.setName(request.getName());
        template.setDescription(request.getDescription());
        template.setItemsJson(request.getItemsJson());
        DeliverableTemplate updated = deliverableTemplateService.updateTemplate(id, template);
        return Result.success(updated);
    }

    /**
     * Delete a deliverable template.
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteTemplate(@PathVariable Long id) {
        deliverableTemplateService.deleteTemplate(id);
        return Result.success();
    }

    // -----------------------------------------------------------------------
    //  DTOs
    // -----------------------------------------------------------------------

    @Data
    public static class CreateTemplateRequest {
        private String name;
        private String description;
        private String itemsJson;
    }

    @Data
    public static class UpdateTemplateRequest {
        private String name;
        private String description;
        private String itemsJson;
    }
}
