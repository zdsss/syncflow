package com.syncflow.workflow.controller.wf;

import com.syncflow.common.result.Result;
import com.syncflow.workflow.dto.ApprovalConfigDTO;
import com.syncflow.workflow.dto.ApprovalConfigVO;
import com.syncflow.workflow.service.ApprovalConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for approval chain configuration management.
 */
@RestController
@RequestMapping("/api/approval-configs")
@RequiredArgsConstructor
@Validated
public class ApprovalConfigController {

    private final ApprovalConfigService approvalConfigService;

    /**
     * List approval configurations, optionally filtered by objectType and processKey.
     */
    @GetMapping
    public Result<List<ApprovalConfigVO>> list(
            @RequestParam(required = false) String objectType,
            @RequestParam(required = false) String processKey) {
        List<ApprovalConfigVO> configs = approvalConfigService.list(objectType, processKey);
        return Result.success(configs);
    }

    /**
     * Get a single approval configuration by id.
     */
    @GetMapping("/{id}")
    public Result<ApprovalConfigVO> getById(@PathVariable Long id) {
        ApprovalConfigVO config = approvalConfigService.getById(id);
        return Result.success(config);
    }

    /**
     * Create a new approval configuration.
     */
    @PostMapping
    public Result<ApprovalConfigVO> create(@Valid @RequestBody ApprovalConfigDTO dto) {
        ApprovalConfigVO created = approvalConfigService.create(dto);
        return Result.success(created);
    }

    /**
     * Update an existing approval configuration.
     */
    @PutMapping("/{id}")
    public Result<ApprovalConfigVO> update(@PathVariable Long id,
                                           @Valid @RequestBody ApprovalConfigDTO dto) {
        ApprovalConfigVO updated = approvalConfigService.update(id, dto);
        return Result.success(updated);
    }

    /**
     * Delete an approval configuration.
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        approvalConfigService.delete(id);
        return Result.success();
    }

    /**
     * Toggle the enabled/disabled state of an approval configuration.
     */
    @PutMapping("/{id}/toggle")
    public Result<Void> toggle(@PathVariable Long id) {
        approvalConfigService.toggle(id);
        return Result.success();
    }
}
