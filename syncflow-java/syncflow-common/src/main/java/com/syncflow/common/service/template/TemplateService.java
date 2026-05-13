package com.syncflow.common.service.template;

import com.syncflow.common.dto.template.CreateTemplateDTO;
import com.syncflow.common.dto.template.TemplateVO;
import com.syncflow.common.result.PageResult;
import org.springframework.web.multipart.MultipartFile;

/**
 * Template service interface.
 */
public interface TemplateService {

    /**
     * Paginated template list.
     */
    PageResult<TemplateVO> getTemplateList(String keyword, int pageNum, int pageSize);

    /**
     * Template detail by id.
     */
    TemplateVO getTemplateDetail(Long id);

    /**
     * Create a new template.
     */
    TemplateVO createTemplate(CreateTemplateDTO dto);

    /**
     * Update an existing template.
     */
    TemplateVO updateTemplate(Long id, CreateTemplateDTO dto);

    /**
     * Delete a template (soft delete).
     */
    void deleteTemplate(Long id);

    /**
     * Preview a template.
     */
    TemplateVO previewTemplate(Long id);

    /**
     * Apply a template (increments usage count).
     */
    void applyTemplate(Long id);

    /**
     * Duplicate a template.
     */
    TemplateVO duplicateTemplate(Long id);

    /**
     * Export a template as JSON string.
     */
    String exportTemplate(Long id);

    /**
     * Import a template from JSON string.
     */
    TemplateVO importTemplate(String templateJson);
}
