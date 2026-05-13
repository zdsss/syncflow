package com.syncflow.workflow.service;

import com.syncflow.workflow.dto.ApprovalConfigDTO;
import com.syncflow.workflow.dto.ApprovalConfigVO;

import java.util.List;

/**
 * Service interface for approval configuration CRUD operations.
 */
public interface ApprovalConfigService {

    /**
     * List configurations filtered by objectType and processKey.
     */
    List<ApprovalConfigVO> list(String objectType, String processKey);

    /**
     * Get a single configuration by id.
     */
    ApprovalConfigVO getById(Long id);

    /**
     * Create a new approval configuration.
     */
    ApprovalConfigVO create(ApprovalConfigDTO dto);

    /**
     * Update an existing approval configuration.
     */
    ApprovalConfigVO update(Long id, ApprovalConfigDTO dto);

    /**
     * Delete an approval configuration.
     */
    void delete(Long id);

    /**
     * Toggle the enabled/disabled state of a configuration.
     */
    void toggle(Long id);
}
