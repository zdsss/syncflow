package com.syncflow.config.controller.cfg;

import com.syncflow.common.result.Result;
import com.syncflow.config.dto.*;
import com.syncflow.config.entity.ModuleCategory;
import com.syncflow.config.service.ModuleLibraryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Module library controller.
 * <p>
 * Manages module categories, modules, specs, and spec parameters.
 */
@RestController
@RequestMapping("/api/config/modules")
public class ModuleLibraryController {

    private final ModuleLibraryService moduleLibraryService;

    public ModuleLibraryController(ModuleLibraryService moduleLibraryService) {
        this.moduleLibraryService = moduleLibraryService;
    }

    // -----------------------------------------------------------------------
    //  Category tree
    // -----------------------------------------------------------------------

    /**
     * Get the module category tree.
     *
     * @param parentId optional parent id (null for full tree)
     */
    @GetMapping("/categories")
    public Result<List<CategoryTreeVO>> getCategoryTree(
            @RequestParam(required = false) Long parentId) {
        List<CategoryTreeVO> tree = moduleLibraryService.getCategoryTree(parentId);
        return Result.success(tree);
    }

    /**
     * Create a new module category.
     */
    @PostMapping("/categories")
    public Result<ModuleCategory> createCategory(@Valid @RequestBody ModuleCategory category) {
        ModuleCategory created = moduleLibraryService.createCategory(category);
        return Result.success(created);
    }

    // -----------------------------------------------------------------------
    //  Modules
    // -----------------------------------------------------------------------

    /**
     * Get modules by category.
     *
     * @param categoryId optional category filter
     */
    @GetMapping
    public Result<List<ModuleVO>> getModulesByCategory(
            @RequestParam(required = false) Long categoryId) {
        List<ModuleVO> modules = moduleLibraryService.getModulesByCategory(categoryId);
        return Result.success(modules);
    }

    /**
     * Create a new module.
     */
    @PostMapping
    public Result<ModuleVO> createModule(@Valid @RequestBody CreateModuleDTO dto) {
        ModuleVO vo = moduleLibraryService.createModule(dto);
        return Result.success(vo);
    }

    // -----------------------------------------------------------------------
    //  Specs
    // -----------------------------------------------------------------------

    /**
     * Get specs for a module.
     */
    @GetMapping("/{moduleId}/specs")
    public Result<List<SpecVO>> getSpecs(@PathVariable Long moduleId) {
        List<SpecVO> specs = moduleLibraryService.getSpecs(moduleId);
        return Result.success(specs);
    }

    /**
     * Create a new spec for a module.
     */
    @PostMapping("/{moduleId}/specs")
    public Result<SpecVO> createSpec(@PathVariable Long moduleId,
                                     @Valid @RequestBody CreateSpecDTO dto) {
        SpecVO vo = moduleLibraryService.createSpec(moduleId, dto);
        return Result.success(vo);
    }

    // -----------------------------------------------------------------------
    //  Spec params
    // -----------------------------------------------------------------------

    /**
     * Get parameters for a spec.
     */
    @GetMapping("/specs/{specId}/params")
    public Result<List<SpecParamVO>> getSpecParams(@PathVariable Long specId) {
        List<SpecParamVO> params = moduleLibraryService.getSpecParams(specId);
        return Result.success(params);
    }

    /**
     * Create a new parameter for a spec.
     */
    @PostMapping("/specs/{specId}/params")
    public Result<SpecParamVO> createSpecParam(@PathVariable Long specId,
                                               @Valid @RequestBody CreateSpecParamDTO dto) {
        SpecParamVO vo = moduleLibraryService.createSpecParam(specId, dto);
        return Result.success(vo);
    }

    // -----------------------------------------------------------------------
    //  Publish
    // -----------------------------------------------------------------------

    /**
     * Publish a spec (start approval workflow).
     */
    @PostMapping("/specs/{specId}/publish")
    public Result<SpecVO> publishSpec(@PathVariable Long specId) {
        SpecVO vo = moduleLibraryService.publishSpec(specId);
        return Result.success(vo);
    }
}
