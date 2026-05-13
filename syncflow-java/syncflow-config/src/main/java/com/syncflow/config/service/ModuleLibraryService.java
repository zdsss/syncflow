package com.syncflow.config.service;

import com.syncflow.common.config.CacheConfig;
import com.syncflow.config.dto.*;
import com.syncflow.config.entity.ModuleCategory;
import org.springframework.cache.annotation.Cacheable;

import java.util.List;

/**
 * Module library service interface.
 * <p>
 * Manages module categories, modules, specs, and spec parameters.
 */
public interface ModuleLibraryService {

    /**
     * Get the module category tree starting from a given parent.
     *
     * @param parentId root parent id (null for the entire tree)
     * @return list of top-level category tree nodes with children
     */
    @Cacheable(value = CacheConfig.CACHE_MODULE_CATEGORIES, key = "#root.args[0] != null ? #root.args[0] : 'root'")
    List<CategoryTreeVO> getCategoryTree(Long parentId);

    /**
     * Create a new module category.
     *
     * @param category the category entity to persist
     * @return the persisted category
     */
    ModuleCategory createCategory(ModuleCategory category);

    /**
     * Get all modules belonging to a category.
     *
     * @param categoryId FK to cfg_module_category.id
     * @return list of module view objects
     */
    List<ModuleVO> getModulesByCategory(Long categoryId);

    /**
     * Create a new module.
     *
     * @dto dto creation parameters
     * @return the created module view object
     */
    ModuleVO createModule(CreateModuleDTO dto);

    /**
     * Get all specs for a module.
     *
     * @param moduleId FK to cfg_module.id
     * @return list of spec view objects
     */
    List<SpecVO> getSpecs(Long moduleId);

    /**
     * Create a new spec for a module.
     *
     * @param moduleId FK to cfg_module.id
     * @param dto      creation parameters
     * @return the created spec view object
     */
    SpecVO createSpec(Long moduleId, CreateSpecDTO dto);

    /**
     * Get all parameters for a spec.
     *
     * @param specId FK to cfg_module_spec.id
     * @return list of spec parameter view objects
     */
    List<SpecParamVO> getSpecParams(Long specId);

    /**
     * Create a new parameter for a spec.
     *
     * @param specId FK to cfg_module_spec.id
     * @param dto    creation parameters
     * @return the created spec parameter view object
     */
    SpecParamVO createSpecParam(Long specId, CreateSpecParamDTO dto);

    /**
     * Publish a spec (update status and start an approval workflow).
     *
     * @param specId FK to cfg_module_spec.id
     * @return the updated spec view object
     */
    SpecVO publishSpec(Long specId);
}
