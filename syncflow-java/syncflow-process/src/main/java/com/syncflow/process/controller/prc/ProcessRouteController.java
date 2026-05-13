package com.syncflow.process.controller.prc;

import com.syncflow.common.result.Result;
import com.syncflow.process.dto.*;
import com.syncflow.process.service.ProcessRouteService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Process route management controller.
 */
@RestController
@RequestMapping("/api/process-routes")
public class ProcessRouteController {

    private final ProcessRouteService processRouteService;

    public ProcessRouteController(ProcessRouteService processRouteService) {
        this.processRouteService = processRouteService;
    }

    @GetMapping
    public Result<List<ProcessRouteVO>> getRouteList(
            @RequestParam(required = false) Long bomId,
            @RequestParam(required = false) Long projectId) {
        List<ProcessRouteVO> list = processRouteService.getRouteList(bomId, projectId);
        return Result.success(list);
    }

    @GetMapping("/{id}")
    public Result<ProcessRouteDetailVO> getRouteDetail(@PathVariable Long id) {
        ProcessRouteDetailVO detail = processRouteService.getRouteDetail(id);
        return Result.success(detail);
    }

    @PostMapping
    public Result<ProcessRouteVO> createRoute(@Valid @RequestBody CreateProcessRouteDTO dto) {
        ProcessRouteVO vo = processRouteService.createRoute(dto);
        return Result.success(vo);
    }

    @DeleteMapping("/{id}")
    public Result<Void> deleteRoute(@PathVariable Long id) {
        processRouteService.deleteRoute(id);
        return Result.success();
    }

    @PostMapping("/{id}/operations")
    public Result<OperationVO> addOperation(@PathVariable Long id,
                                            @Valid @RequestBody CreateOperationDTO dto) {
        OperationVO vo = processRouteService.addOperation(id, dto);
        return Result.success(vo);
    }

    @PutMapping("/operations/{operationId}")
    public Result<OperationVO> updateOperation(@PathVariable Long operationId,
                                               @Valid @RequestBody CreateOperationDTO dto) {
        OperationVO vo = processRouteService.updateOperation(operationId, dto);
        return Result.success(vo);
    }

    @DeleteMapping("/operations/{operationId}")
    public Result<Void> deleteOperation(@PathVariable Long operationId) {
        processRouteService.deleteOperation(operationId);
        return Result.success();
    }

    @PutMapping("/{id}/operations/reorder")
    public Result<Void> reorderOperations(@PathVariable Long id,
                                          @RequestBody List<Long> operationIds) {
        processRouteService.reorderOperations(id, operationIds);
        return Result.success();
    }

    @PostMapping("/{id}/submit-approval")
    public Result<Void> submitForApproval(@PathVariable Long id) {
        processRouteService.submitForApproval(id);
        return Result.success();
    }

    @PostMapping("/{id}/withdraw-approval")
    public Result<Void> withdrawApproval(@PathVariable Long id) {
        processRouteService.withdrawApproval(id);
        return Result.success();
    }

    // ── Versions ──────────────────────────────────────────────────────

    @GetMapping("/{id}/versions")
    public Result<List<RouteVersionVO>> getVersions(@PathVariable Long id) {
        List<RouteVersionVO> versions = processRouteService.getVersions(id);
        return Result.success(versions);
    }

    @PostMapping("/{id}/versions")
    public Result<RouteVersionVO> createVersion(@PathVariable Long id,
                                                @RequestBody(required = false) Map<String, String> body) {
        String description = body != null ? body.get("description") : null;
        RouteVersionVO vo = processRouteService.createVersion(id, description);
        return Result.success(vo);
    }
}
