package com.syncflow.common.service.resource;

import com.syncflow.common.dto.resource.CreateResourceDTO;
import com.syncflow.common.dto.resource.ResourceVO;
import com.syncflow.common.result.PageResult;

/**
 * Resource management service interface.
 */
public interface ResourceService {

    /**
     * Paginated resource list.
     */
    PageResult<ResourceVO> getResourceList(String keyword, String type, int pageNum, int pageSize);

    /**
     * Resource detail by id.
     */
    ResourceVO getResourceDetail(Long id);

    /**
     * Create a resource.
     */
    ResourceVO createResource(CreateResourceDTO dto);

    /**
     * Update a resource.
     */
    ResourceVO updateResource(Long id, CreateResourceDTO dto);

    /**
     * Delete a resource (soft delete).
     */
    void deleteResource(Long id);
}
