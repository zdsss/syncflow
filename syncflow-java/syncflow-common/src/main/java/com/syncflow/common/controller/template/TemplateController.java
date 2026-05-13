package com.syncflow.common.controller.template;

import com.syncflow.common.dto.template.CreateTemplateDTO;
import com.syncflow.common.dto.template.TemplateVO;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.result.Result;
import com.syncflow.common.service.template.TemplateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Template management controller.
 */
@RestController
@RequestMapping("/api/templates")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    /**
     * Paginated template list.
     */
    @GetMapping
    public Result<PageResult<TemplateVO>> getTemplateList(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<TemplateVO> result = templateService.getTemplateList(keyword, pageNum, pageSize);
        return Result.success(result);
    }

    /**
     * Template detail.
     */
    @GetMapping("/{id}")
    public Result<TemplateVO> getTemplateDetail(@PathVariable Long id) {
        TemplateVO vo = templateService.getTemplateDetail(id);
        return Result.success(vo);
    }

    /**
     * Create a new template.
     */
    @PostMapping
    public Result<TemplateVO> createTemplate(@Valid @RequestBody CreateTemplateDTO dto) {
        TemplateVO vo = templateService.createTemplate(dto);
        return Result.success(vo);
    }

    /**
     * Update a template.
     */
    @PatchMapping("/{id}")
    public Result<TemplateVO> updateTemplate(@PathVariable Long id,
                                             @Valid @RequestBody CreateTemplateDTO dto) {
        TemplateVO vo = templateService.updateTemplate(id, dto);
        return Result.success(vo);
    }

    /**
     * Delete a template.
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteTemplate(@PathVariable Long id) {
        templateService.deleteTemplate(id);
        return Result.success();
    }

    /**
     * Preview a template.
     */
    @GetMapping("/{id}/preview")
    public Result<TemplateVO> previewTemplate(@PathVariable Long id) {
        TemplateVO vo = templateService.previewTemplate(id);
        return Result.success(vo);
    }

    /**
     * Apply a template (increments usage count).
     */
    @PostMapping("/{id}/apply")
    public Result<Void> applyTemplate(@PathVariable Long id) {
        templateService.applyTemplate(id);
        return Result.success();
    }

    /**
     * Duplicate a template.
     */
    @PostMapping("/{id}/duplicate")
    public Result<TemplateVO> duplicateTemplate(@PathVariable Long id) {
        TemplateVO vo = templateService.duplicateTemplate(id);
        return Result.success(vo);
    }

    /**
     * Export a template as JSON.
     */
    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportTemplate(@PathVariable Long id) {
        String content = templateService.exportTemplate(id);
        byte[] bytes = content != null ? content.getBytes() : new byte[0];

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=template-" + id + ".json")
                .contentType(MediaType.APPLICATION_JSON)
                .contentLength(bytes.length)
                .body(bytes);
    }

    /**
     * Import a template from JSON.
     */
    @PostMapping("/import")
    public Result<TemplateVO> importTemplate(@RequestBody String templateJson) {
        TemplateVO vo = templateService.importTemplate(templateJson);
        return Result.success(vo);
    }
}
