package com.syncflow.common.controller.resource;

import com.syncflow.common.dto.resource.CreateResourceDTO;
import com.syncflow.common.dto.resource.ResourceVO;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.result.Result;
import com.syncflow.common.service.resource.ResourceService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * Resource management controller.
 */
@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    /**
     * Paginated resource list.
     */
    @GetMapping
    public Result<PageResult<ResourceVO>> getResourceList(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        PageResult<ResourceVO> result = resourceService.getResourceList(keyword, type, pageNum, pageSize);
        return Result.success(result);
    }

    /**
     * Resource detail.
     */
    @GetMapping("/{id}")
    public Result<ResourceVO> getResourceDetail(@PathVariable Long id) {
        ResourceVO vo = resourceService.getResourceDetail(id);
        return Result.success(vo);
    }

    /**
     * Create a resource.
     */
    @PostMapping
    public Result<ResourceVO> createResource(@Valid @RequestBody CreateResourceDTO dto) {
        ResourceVO vo = resourceService.createResource(dto);
        return Result.success(vo);
    }

    /**
     * Update a resource.
     */
    @PatchMapping("/{id}")
    public Result<ResourceVO> updateResource(@PathVariable Long id,
                                             @Valid @RequestBody CreateResourceDTO dto) {
        ResourceVO vo = resourceService.updateResource(id, dto);
        return Result.success(vo);
    }

    /**
     * Delete a resource.
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return Result.success();
    }
}
