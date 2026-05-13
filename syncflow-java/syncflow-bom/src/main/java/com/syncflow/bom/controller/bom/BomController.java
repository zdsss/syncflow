package com.syncflow.bom.controller.bom;

import com.syncflow.bom.dto.*;
import com.syncflow.bom.service.BomService;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.result.Result;
import com.syncflow.workflow.entity.ChangeRequest;
import com.syncflow.workflow.service.ChangeRequestService;
import com.syncflow.workflow.service.WorkflowService;
import com.syncflow.common.util.SecurityUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BOM management controller.
 */
@RestController
@RequestMapping("/api/boms")
public class BomController {

    private final BomService bomService;
    private final ChangeRequestService changeRequestService;
    private final WorkflowService workflowService;
    private final ObjectMapper objectMapper;

    public BomController(BomService bomService, ChangeRequestService changeRequestService,
                         WorkflowService workflowService, ObjectMapper objectMapper) {
        this.bomService = bomService;
        this.changeRequestService = changeRequestService;
        this.workflowService = workflowService;
        this.objectMapper = objectMapper;
    }

    /**
     * List BOMs, optionally filtered by project.
     */
    @GetMapping
    public Result<List<BomVO>> listBoms(
            @RequestParam(required = false) Long projectId) {
        List<BomVO> result = bomService.listBoms(projectId);
        return Result.success(result);
    }

    /**
     * BOM detail.
     */
    @GetMapping("/{id}")
    public Result<BomVO> getBomDetail(@PathVariable Long id) {
        BomVO vo = bomService.getBomDetail(id);
        return Result.success(vo);
    }

    /**
     * BOM item tree structure.
     */
    @GetMapping("/{id}/structure")
    public Result<List<BomItemTreeVO>> getBomStructure(@PathVariable Long id) {
        List<BomItemTreeVO> tree = bomService.getBomStructure(id);
        return Result.success(tree);
    }

    /**
     * Create a new BOM.
     */
    @PostMapping
    public Result<BomVO> createBom(@Valid @RequestBody CreateBomDTO dto) {
        BomVO vo = bomService.createBom(dto);
        return Result.success(vo);
    }

    /**
     * Add a BOM item to a BOM.
     */
    @PostMapping("/{id}/items")
    public Result<BomItemTreeVO> addBomItem(@PathVariable Long id,
                                            @Valid @RequestBody CreateBomItemDTO dto) {
        BomItemTreeVO vo = bomService.addBomItem(id, dto);
        return Result.success(vo);
    }

    /**
     * Update a BOM item.
     */
    @PutMapping("/items/{itemId}")
    public Result<BomItemTreeVO> updateBomItem(@PathVariable Long itemId,
                                               @Valid @RequestBody CreateBomItemDTO dto) {
        BomItemTreeVO vo = bomService.updateBomItem(itemId, dto);
        return Result.success(vo);
    }

    /**
     * Delete a BOM item (and its children).
     */
    @DeleteMapping("/items/{itemId}")
    public Result<Void> deleteBomItem(@PathVariable Long itemId) {
        bomService.deleteBomItem(itemId);
        return Result.success();
    }

    /**
     * Submit a BOM for approval.
     */
    @PostMapping("/{id}/submit-approval")
    public Result<Void> submitForApproval(@PathVariable Long id) {
        bomService.submitForApproval(id);
        return Result.success();
    }

    /**
     * Withdraw a pending BOM approval.
     */
    @PostMapping("/{id}/withdraw-approval")
    public Result<Void> withdrawApproval(@PathVariable Long id) {
        bomService.withdrawApproval(id);
        return Result.success();
    }

    /**
     * Save a new version of the BOM.
     */
    @PostMapping("/{id}/save-version")
    public Result<BomVO> saveVersion(@PathVariable Long id,
                                     @RequestParam(required = false) String changeSummary) {
        BomVO vo = bomService.saveVersion(id, changeSummary);
        return Result.success(vo);
    }

    /**
     * Get version history of a BOM.
     */
    @GetMapping("/{id}/versions")
    public Result<List<BomVersionVO>> getVersionHistory(@PathVariable Long id) {
        List<BomVersionVO> versions = bomService.getVersionHistory(id);
        return Result.success(versions);
    }

    /**
     * Compare two versions of a BOM and return item-level diffs.
     * <p>
     * Example: GET /api/boms/42/compare?v1=1.0&v2=1.1
     */
    @GetMapping("/{id}/compare")
    public Result<BomVersionCompareVO> compareVersions(
            @PathVariable Long id,
            @RequestParam String v1,
            @RequestParam String v2) {
        return Result.success(bomService.compareVersions(id, v1, v2));
    }

    /**
     * Roll back a BOM to a previously saved version.
     * Example: POST /api/boms/42/rollback?targetVersion=1.0
     */
    @PostMapping("/{id}/rollback")
    public Result<Void> rollbackVersion(@PathVariable Long id,
                                        @RequestParam String targetVersion) {
        bomService.rollbackVersion(id, targetVersion);
        return Result.success();
    }

    /**
     * Get change requests for a BOM.
     */
    @GetMapping("/{id}/change-requests")
    public Result<List<ChangeRequest>> getChangeRequests(@PathVariable Long id) {
        List<ChangeRequest> requests = changeRequestService.getRequestsByObject("BOM_CHANGE", id);
        return Result.success(requests);
    }

    /**
     * Submit a BOM change request and start the CHANGE_APPROVAL workflow.
     * changeData is a JSON string describing the change (ADD_ITEM / UPDATE_ITEM / DELETE_ITEM).
     */
    @PostMapping("/{id}/change-requests")
    public Result<Map<String, Object>> createChangeRequest(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String changeType = (String) body.get("changeType");
        if (changeType == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "changeType is required");
        }

        // Build changeData JSON from the request body fields
        String changeData;
        try {
            Map<String, Object> dataMap = new java.util.LinkedHashMap<>();
            switch (changeType) {
                case "ADD_ITEM" -> {
                    dataMap.put("name", body.get("name"));
                    dataMap.put("sourceType", body.getOrDefault("sourceType", "MADE"));
                    dataMap.put("quantity", body.getOrDefault("quantity", 1));
                    if (body.get("specification") != null) dataMap.put("specification", body.get("specification"));
                    if (body.get("materialCode") != null) dataMap.put("materialCode", body.get("materialCode"));
                    if (body.get("unitOfMeasure") != null) dataMap.put("unit", body.get("unitOfMeasure"));
                    if (body.get("parentId") != null) dataMap.put("parentId", body.get("parentId"));
                }
                case "UPDATE_ITEM" -> {
                    dataMap.put("itemId", body.get("itemId"));
                    if (body.get("name") != null) dataMap.put("name", body.get("name"));
                    if (body.get("sourceType") != null) dataMap.put("sourceType", body.get("sourceType"));
                    if (body.get("quantity") != null) dataMap.put("quantity", body.get("quantity"));
                    if (body.get("specification") != null) dataMap.put("specification", body.get("specification"));
                    if (body.get("materialCode") != null) dataMap.put("materialCode", body.get("materialCode"));
                }
                case "DELETE_ITEM" -> dataMap.put("itemId", body.get("itemId"));
                default -> throw new BusinessException(ErrorCode.PARAM_ERROR, "Unknown changeType: " + changeType);
            }
            changeData = objectMapper.writeValueAsString(dataMap);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "Failed to serialize changeData: " + e.getMessage());
        }

        String changeSummary = (String) body.getOrDefault("description", changeType);
        Long requestedBy = SecurityUtils.getUserId();

        Long crId = changeRequestService.createRequest("BOM_CHANGE", id, changeType,
                changeData, changeSummary, requestedBy);

        BomVO bom = bomService.getBomDetail(id);
        workflowService.startProcess("CHANGE_APPROVAL", crId, "BOM_CHANGE",
                changeSummary, bom.getProjectId(), requestedBy);

        return Result.success(Map.of("changeRequestId", crId));
    }
}
