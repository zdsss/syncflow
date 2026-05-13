package com.syncflow.config.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.common.config.CacheConfig;
import com.syncflow.config.dto.*;
import com.syncflow.config.entity.Module;
import com.syncflow.config.entity.ModuleCategory;
import com.syncflow.config.entity.ModuleSpec;
import com.syncflow.config.entity.SpecParam;
import com.syncflow.config.mapper.ModuleCategoryMapper;
import com.syncflow.config.mapper.ModuleMapper;
import com.syncflow.config.mapper.ModuleSpecMapper;
import com.syncflow.config.mapper.SpecParamMapper;
import com.syncflow.config.service.ModuleLibraryService;
import com.syncflow.workflow.service.ChangeApprovalInterceptor;
import com.syncflow.workflow.service.WorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Module library service implementation.
 */
@Service
public class ModuleLibraryServiceImpl implements ModuleLibraryService {

    private final ModuleCategoryMapper categoryMapper;
    private final ModuleMapper moduleMapper;
    private final ModuleSpecMapper specMapper;
    private final SpecParamMapper paramMapper;
    private final WorkflowService workflowService;

    @Lazy
    private ChangeApprovalInterceptor changeInterceptor;

    @Autowired
    public void setChangeInterceptor(@Lazy ChangeApprovalInterceptor changeInterceptor) {
        this.changeInterceptor = changeInterceptor;
    }

    public ModuleLibraryServiceImpl(ModuleCategoryMapper categoryMapper,
                                     ModuleMapper moduleMapper,
                                     ModuleSpecMapper specMapper,
                                     SpecParamMapper paramMapper,
                                     WorkflowService workflowService) {
        this.categoryMapper = categoryMapper;
        this.moduleMapper = moduleMapper;
        this.specMapper = specMapper;
        this.paramMapper = paramMapper;
        this.workflowService = workflowService;
    }

    // -----------------------------------------------------------------------
    //  Category tree
    // -----------------------------------------------------------------------

    @Override
    @Cacheable(value = CacheConfig.CACHE_MODULE_CATEGORIES, key = "#root.args[0] != null ? #root.args[0] : 'root'")
    public List<CategoryTreeVO> getCategoryTree(Long parentId) {
        LambdaQueryWrapper<ModuleCategory> wrapper = new LambdaQueryWrapper<>();
        if (parentId == null) {
            wrapper.isNull(ModuleCategory::getParentId)
                   .orderByAsc(ModuleCategory::getSortOrder);
        } else {
            wrapper.eq(ModuleCategory::getParentId, parentId)
                   .orderByAsc(ModuleCategory::getSortOrder);
        }
        List<ModuleCategory> roots = categoryMapper.selectList(wrapper);
        return roots.stream()
                .map(this::toCategoryTreeVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ModuleCategory createCategory(ModuleCategory category) {
        // Set path and level based on parent
        if (category.getParentId() != null) {
            ModuleCategory parent = categoryMapper.selectById(category.getParentId());
            if (parent == null) {
                throw new BusinessException(ErrorCode.NOT_FOUND, "Parent category not found");
            }
            category.setPath(parent.getPath() + "/" + parent.getId());
            category.setLevel(parent.getLevel() != null ? parent.getLevel() + 1 : 1);
        } else {
            category.setPath("0");
            category.setLevel(0);
        }
        categoryMapper.insert(category);
        return category;
    }

    // -----------------------------------------------------------------------
    //  Modules
    // -----------------------------------------------------------------------

    @Override
    public List<ModuleVO> getModulesByCategory(Long categoryId) {
        LambdaQueryWrapper<Module> wrapper = new LambdaQueryWrapper<>();
        if (categoryId != null) {
            wrapper.eq(Module::getCategoryId, categoryId);
        }
        wrapper.orderByAsc(Module::getSortOrder);
        List<Module> modules = moduleMapper.selectList(wrapper);
        return modules.stream()
                .map(this::toModuleVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ModuleVO createModule(CreateModuleDTO dto) {
        Module module = new Module();
        module.setName(dto.getName());
        module.setCode(dto.getCode());
        module.setCategoryId(dto.getCategoryId());
        module.setDescription(dto.getDescription());
        module.setStatus(1);
        module.setSortOrder(0);
        moduleMapper.insert(module);
        return toModuleVO(module);
    }

    // -----------------------------------------------------------------------
    //  Specs
    // -----------------------------------------------------------------------

    @Override
    public List<SpecVO> getSpecs(Long moduleId) {
        LambdaQueryWrapper<ModuleSpec> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ModuleSpec::getModuleId, moduleId)
               .orderByAsc(ModuleSpec::getCreatedAt);
        List<ModuleSpec> specs = specMapper.selectList(wrapper);
        return specs.stream()
                .map(this::toSpecVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SpecVO createSpec(Long moduleId, CreateSpecDTO dto) {
        // Verify module exists
        Module module = moduleMapper.selectById(moduleId);
        if (module == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Module not found");
        }

        ModuleSpec spec = new ModuleSpec();
        spec.setModuleId(moduleId);
        spec.setSpecName(dto.getSpecName());
        spec.setCrossSection(dto.getCrossSection());
        spec.setMaterial(dto.getMaterial());
        spec.setWallThickness(dto.getWallThickness());
        spec.setConnectionType(dto.getConnectionType());
        spec.setSpecCode(generateSpecCode(module.getCode()));
        spec.setStatus(0); // draft
        spec.setCreatedBy(SecurityUtils.getUserId());
        specMapper.insert(spec);

        return toSpecVO(spec);
    }

    // -----------------------------------------------------------------------
    //  Spec params
    // -----------------------------------------------------------------------

    @Override
    public List<SpecParamVO> getSpecParams(Long specId) {
        LambdaQueryWrapper<SpecParam> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SpecParam::getSpecId, specId)
               .orderByAsc(SpecParam::getSortOrder);
        List<SpecParam> params = paramMapper.selectList(wrapper);
        return params.stream()
                .map(this::toSpecParamVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SpecParamVO createSpecParam(Long specId, CreateSpecParamDTO dto) {
        // Verify spec exists
        ModuleSpec spec = specMapper.selectById(specId);
        if (spec == null) {
            throw new BusinessException(ErrorCode.SPEC_NOT_FOUND);
        }

        // Intercept changes on published specs
        ensureSpecEditable(specId, "ADD_PARAM", dto);

        SpecParam param = new SpecParam();
        param.setSpecId(specId);
        param.setParamName(dto.getParamName());
        param.setParamType(dto.getParamType());
        param.setControlType(dto.getControlType());
        param.setDefaultValue(dto.getDefaultValue());
        param.setOptions(dto.getOptions());
        param.setMinValue(dto.getMinValue());
        param.setMaxValue(dto.getMaxValue());
        param.setUnit(dto.getUnit());
        param.setIsRequired(dto.getIsRequired());
        param.setSortOrder(0);
        paramMapper.insert(param);

        return toSpecParamVO(param);
    }

    // -----------------------------------------------------------------------
    //  Publish spec
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public SpecVO publishSpec(Long specId) {
        ModuleSpec spec = specMapper.selectById(specId);
        if (spec == null) {
            throw new BusinessException(ErrorCode.SPEC_NOT_FOUND);
        }

        // Already published
        if (spec.getStatus() != null && spec.getStatus() == 1) {
            throw new BusinessException(ErrorCode.SPEC_PUBLISHED);
        }

        // Set status to pending approval (status=2); actual publish happens in BPMN callback
        spec.setStatus(2); // pending approval

        // Start approval workflow
        Long currentUserId = SecurityUtils.getUserId();
        Long flowBusinessObjectId = workflowService.startProcess(
                "MODULE_SPEC_APPROVAL",    // process key
                spec.getId(),       // object id
                "MODULE_SPEC",      // object type
                spec.getSpecName(), // object name
                null,               // project id (specs are global)
                currentUserId       // applicant
        );
        spec.setFlowInstanceId(flowBusinessObjectId != null ? String.valueOf(flowBusinessObjectId) : null);

        specMapper.updateById(spec);

        return toSpecVO(spec);
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    private CategoryTreeVO toCategoryTreeVO(ModuleCategory category) {
        CategoryTreeVO vo = new CategoryTreeVO();
        vo.setId(category.getId());
        vo.setName(category.getName());
        vo.setCode(category.getCode());
        vo.setLevel(category.getLevel());

        // Recursively load children
        LambdaQueryWrapper<ModuleCategory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ModuleCategory::getParentId, category.getId())
               .orderByAsc(ModuleCategory::getSortOrder);
        List<ModuleCategory> children = categoryMapper.selectList(wrapper);
        if (children != null && !children.isEmpty()) {
            vo.setChildren(children.stream()
                    .map(this::toCategoryTreeVO)
                    .collect(Collectors.toList()));
        } else {
            vo.setChildren(new ArrayList<>());
        }

        return vo;
    }

    private ModuleVO toModuleVO(Module module) {
        ModuleVO vo = new ModuleVO();
        vo.setId(module.getId());
        vo.setCode(module.getCode());
        vo.setName(module.getName());
        vo.setDescription(module.getDescription());
        vo.setStatus(module.getStatus());

        // Enrich category name
        if (module.getCategoryId() != null) {
            ModuleCategory category = categoryMapper.selectById(module.getCategoryId());
            if (category != null) {
                vo.setCategoryName(category.getName());
            }
        }

        return vo;
    }

    private SpecVO toSpecVO(ModuleSpec spec) {
        SpecVO vo = new SpecVO();
        vo.setId(spec.getId());
        vo.setSpecName(spec.getSpecName());
        vo.setCrossSection(spec.getCrossSection());
        vo.setMaterial(spec.getMaterial());
        vo.setWallThickness(spec.getWallThickness());
        vo.setConnectionType(spec.getConnectionType());
        vo.setSpecCode(spec.getSpecCode());
        vo.setStatus(spec.getStatus());
        return vo;
    }

    private SpecParamVO toSpecParamVO(SpecParam param) {
        SpecParamVO vo = new SpecParamVO();
        vo.setId(param.getId());
        vo.setParamName(param.getParamName());
        vo.setParamType(param.getParamType());
        vo.setControlType(param.getControlType());
        vo.setDefaultValue(param.getDefaultValue());
        vo.setOptions(param.getOptions());
        vo.setMinValue(param.getMinValue());
        vo.setMaxValue(param.getMaxValue());
        vo.setUnit(param.getUnit());
        vo.setIsRequired(param.getIsRequired());
        return vo;
    }

    /**
     * Generate a unique spec code: {moduleCode}-SPEC-{sequence}.
     */
    private String generateSpecCode(String moduleCode) {
        Long count = specMapper.selectCount(new LambdaQueryWrapper<>());
        int seq = (count != null ? count.intValue() : 0) + 1;
        return moduleCode + "-SPEC-" + String.format("%04d", seq);
    }

    /**
     * Ensure the spec is editable. Published specs (status=1) are intercepted
     * as change requests via ChangeApprovalInterceptor.
     */
    private void ensureSpecEditable(Long specId, String changeType, Object changeData) {
        ModuleSpec spec = specMapper.selectById(specId);
        if (spec == null) {
            throw new BusinessException(ErrorCode.SPEC_NOT_FOUND);
        }
        if (spec.getStatus() != null && spec.getStatus() == 1) {
            if (changeInterceptor != null) {
                boolean intercepted = changeInterceptor.intercept(
                        "SPEC_CHANGE", specId, spec.getStatus(), 1,
                        changeType, changeData, null, null, SecurityUtils.getUserId());
                if (intercepted) {
                    throw new BusinessException(ErrorCode.PARAM_ERROR,
                            "已发布规格的修改已提交审批");
                }
            }
            throw new BusinessException(ErrorCode.PARAM_ERROR,
                    "已发布的规格不能直接修改");
        }
    }
}
