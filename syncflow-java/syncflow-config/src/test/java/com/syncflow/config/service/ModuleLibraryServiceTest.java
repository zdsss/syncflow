package com.syncflow.config.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.config.dto.*;
import com.syncflow.config.entity.Module;
import com.syncflow.config.entity.ModuleCategory;
import com.syncflow.config.entity.ModuleSpec;
import com.syncflow.config.entity.SpecParam;
import com.syncflow.config.mapper.ModuleCategoryMapper;
import com.syncflow.config.mapper.ModuleMapper;
import com.syncflow.config.mapper.ModuleSpecMapper;
import com.syncflow.config.mapper.SpecParamMapper;
import com.syncflow.config.service.impl.ModuleLibraryServiceImpl;
import com.syncflow.workflow.service.WorkflowService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ModuleLibraryService")
class ModuleLibraryServiceTest {

    @Mock
    private ModuleCategoryMapper categoryMapper;

    @Mock
    private ModuleMapper moduleMapper;

    @Mock
    private ModuleSpecMapper specMapper;

    @Mock
    private SpecParamMapper paramMapper;

    @Mock
    private WorkflowService workflowService;

    @InjectMocks
    private ModuleLibraryServiceImpl moduleLibraryService;

    private ModuleCategory buildCategory(Long id, String name, Long parentId) {
        ModuleCategory category = new ModuleCategory();
        category.setId(id);
        category.setName(name);
        category.setCode(name.toUpperCase().replace(" ", "_"));
        category.setParentId(parentId);
        category.setLevel(parentId == null ? 0 : 1);
        category.setPath(parentId == null ? "0" : "0/" + parentId);
        category.setSortOrder(0);
        return category;
    }

    private Module buildModule(Long id, String name, Long categoryId) {
        Module module = new Module();
        module.setId(id);
        module.setName(name);
        module.setCode("MOD-" + id);
        module.setCategoryId(categoryId);
        module.setStatus(1);
        module.setSortOrder(0);
        return module;
    }

    private ModuleSpec buildSpec(Long id, Long moduleId) {
        ModuleSpec spec = new ModuleSpec();
        spec.setId(id);
        spec.setModuleId(moduleId);
        spec.setSpecName("Spec " + id);
        spec.setCrossSection("20x30");
        spec.setMaterial("Steel");
        spec.setSpecCode("MOD-" + moduleId + "-SPEC-0001");
        spec.setStatus(0); // draft
        return spec;
    }

    private SpecParam buildSpecParam(Long id, Long specId) {
        SpecParam param = new SpecParam();
        param.setId(id);
        param.setSpecId(specId);
        param.setParamName("Diameter");
        param.setParamType("DECIMAL");
        param.setControlType("INPUT");
        param.setUnit("mm");
        param.setIsRequired(true);
        param.setSortOrder(0);
        return param;
    }

    // -----------------------------------------------------------------------
    //  getCategoryTree
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getCategoryTree()")
    class GetCategoryTree {

        @Test
        @DisplayName("should return root-level categories")
        void shouldReturnRootCategories() {
            ModuleCategory root = buildCategory(1L, "Electronics", null);
            // First call returns root categories, subsequent calls (children lookup) return empty
            when(categoryMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(root))
                    .thenReturn(Collections.emptyList());

            List<CategoryTreeVO> result = moduleLibraryService.getCategoryTree(null);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("Electronics", result.get(0).getName());
            assertTrue(result.get(0).getChildren().isEmpty());
            verify(categoryMapper, atLeastOnce()).selectList(any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("should return empty list when no categories")
        void shouldReturnEmptyList() {
            when(categoryMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());

            List<CategoryTreeVO> result = moduleLibraryService.getCategoryTree(null);

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  createCategory
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("createCategory()")
    class CreateCategory {

        @Test
        @DisplayName("should create root category")
        void shouldCreateRootCategory() {
            ModuleCategory category = new ModuleCategory();
            category.setName("Hardware");
            category.setCode("HW");
            when(categoryMapper.insert(any(ModuleCategory.class))).thenReturn(1);

            ModuleCategory result = moduleLibraryService.createCategory(category);

            assertNotNull(result);
            assertEquals("0", result.getPath());
            assertEquals(0, result.getLevel());
            verify(categoryMapper).insert(category);
        }

        @Test
        @DisplayName("should create child category with parent path")
        void shouldCreateChildCategory() {
            ModuleCategory parent = buildCategory(1L, "Electronics", null);
            when(categoryMapper.selectById(1L)).thenReturn(parent);

            ModuleCategory child = new ModuleCategory();
            child.setName("PCB");
            child.setCode("PCB");
            child.setParentId(1L);
            when(categoryMapper.insert(any(ModuleCategory.class))).thenReturn(1);

            ModuleCategory result = moduleLibraryService.createCategory(child);

            assertNotNull(result);
            assertEquals("0/1", result.getPath());
            assertEquals(1, result.getLevel());
        }

        @Test
        @DisplayName("should throw when parent category not found")
        void shouldThrowWhenParentNotFound() {
            when(categoryMapper.selectById(999L)).thenReturn(null);

            ModuleCategory child = new ModuleCategory();
            child.setName("PCB");
            child.setCode("PCB");
            child.setParentId(999L);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> moduleLibraryService.createCategory(child));
            assertTrue(ex.getMessage().contains("Parent category not found")
                    || ex.getMessage().contains("not found"));
        }
    }

    // -----------------------------------------------------------------------
    //  getModulesByCategory
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getModulesByCategory()")
    class GetModulesByCategory {

        @Test
        @DisplayName("should return modules for a category")
        void shouldReturnModules() {
            Module module = buildModule(1L, "Control Module", 1L);
            when(moduleMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(module));
            ModuleCategory category = buildCategory(1L, "Electronics", null);
            when(categoryMapper.selectById(1L)).thenReturn(category);

            List<ModuleVO> result = moduleLibraryService.getModulesByCategory(1L);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("Control Module", result.get(0).getName());
            assertEquals("Electronics", result.get(0).getCategoryName());
        }
    }

    // -----------------------------------------------------------------------
    //  createModule
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("createModule()")
    class CreateModule {

        @Test
        @DisplayName("should create module")
        void shouldCreateModule() {
            CreateModuleDTO dto = new CreateModuleDTO();
            dto.setName("Power Supply");
            dto.setCode("PS-01");
            dto.setCategoryId(1L);

            when(moduleMapper.insert(any(Module.class))).thenReturn(1);

            ModuleVO result = moduleLibraryService.createModule(dto);

            assertNotNull(result);
            assertEquals("Power Supply", result.getName());
            assertEquals("PS-01", result.getCode());
            verify(moduleMapper).insert(any(Module.class));
        }
    }

    // -----------------------------------------------------------------------
    //  getSpecs
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getSpecs()")
    class GetSpecs {

        @Test
        @DisplayName("should return specs for a module")
        void shouldReturnSpecs() {
            ModuleSpec spec = buildSpec(1L, 1L);
            when(specMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(spec));

            List<SpecVO> result = moduleLibraryService.getSpecs(1L);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("Spec 1", result.get(0).getSpecName());
            assertEquals("Steel", result.get(0).getMaterial());
        }
    }

    // -----------------------------------------------------------------------
    //  createSpec
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("createSpec()")
    class CreateSpec {

        @Test
        @DisplayName("should create spec for module")
        void shouldCreateSpec() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::getUserId).thenReturn(1L);

                Module module = buildModule(1L, "Module 1", 1L);
                module.setCode("MOD-1");
                when(moduleMapper.selectById(1L)).thenReturn(module);
                when(specMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
                when(specMapper.insert(any(ModuleSpec.class))).thenReturn(1);

                CreateSpecDTO dto = new CreateSpecDTO();
                dto.setSpecName("Spec A");
                dto.setCrossSection("20x30");
                dto.setMaterial("Steel");

                SpecVO result = moduleLibraryService.createSpec(1L, dto);

                assertNotNull(result);
                assertEquals("Spec A", result.getSpecName());
                assertEquals("Steel", result.getMaterial());
                assertEquals(0, result.getStatus()); // draft
                verify(specMapper).insert(any(ModuleSpec.class));
            }
        }

        @Test
        @DisplayName("should throw when module not found")
        void shouldThrowWhenModuleNotFound() {
            when(moduleMapper.selectById(999L)).thenReturn(null);

            CreateSpecDTO dto = new CreateSpecDTO();
            dto.setSpecName("Spec A");
            dto.setCrossSection("20x30");
            dto.setMaterial("Steel");

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> moduleLibraryService.createSpec(999L, dto));
            assertTrue(ex.getMessage().contains("Module not found")
                    || ex.getMessage().contains("not found"));
        }
    }

    // -----------------------------------------------------------------------
    //  getSpecParams
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getSpecParams()")
    class GetSpecParams {

        @Test
        @DisplayName("should return params for a spec")
        void shouldReturnSpecParams() {
            SpecParam param = buildSpecParam(1L, 1L);
            when(paramMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(param));

            List<SpecParamVO> result = moduleLibraryService.getSpecParams(1L);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("Diameter", result.get(0).getParamName());
            assertEquals("mm", result.get(0).getUnit());
            assertTrue(result.get(0).getIsRequired());
        }
    }

    // -----------------------------------------------------------------------
    //  createSpecParam
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("createSpecParam()")
    class CreateSpecParam {

        @Test
        @DisplayName("should create spec param")
        void shouldCreateSpecParam() {
            ModuleSpec spec = buildSpec(1L, 1L);
            when(specMapper.selectById(1L)).thenReturn(spec);
            when(paramMapper.insert(any(SpecParam.class))).thenReturn(1);

            CreateSpecParamDTO dto = new CreateSpecParamDTO();
            dto.setParamName("Wall Thickness");
            dto.setParamType("DECIMAL");
            dto.setControlType("INPUT");
            dto.setUnit("mm");
            dto.setIsRequired(true);

            SpecParamVO result = moduleLibraryService.createSpecParam(1L, dto);

            assertNotNull(result);
            assertEquals("Wall Thickness", result.getParamName());
            assertEquals("DECIMAL", result.getParamType());
            verify(paramMapper).insert(any(SpecParam.class));
        }

        @Test
        @DisplayName("should throw when spec not found")
        void shouldThrowWhenSpecNotFound() {
            when(specMapper.selectById(999L)).thenReturn(null);

            CreateSpecParamDTO dto = new CreateSpecParamDTO();
            dto.setParamName("Wall Thickness");

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> moduleLibraryService.createSpecParam(999L, dto));
            assertEquals("Specification not found", ex.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    //  publishSpec
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("publishSpec()")
    class PublishSpec {

        @Test
        @DisplayName("should set spec to pending approval status")
        void shouldPublishSpec() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::getUserId).thenReturn(1L);

                ModuleSpec spec = buildSpec(1L, 1L);
                spec.setStatus(0); // draft
                when(specMapper.selectById(1L)).thenReturn(spec);
                when(workflowService.startProcess(anyString(), anyLong(), anyString(),
                        anyString(), isNull(), anyLong())).thenReturn(1L);
                when(specMapper.updateById(any(ModuleSpec.class))).thenReturn(1);

                SpecVO result = moduleLibraryService.publishSpec(1L);

                assertNotNull(result);
                assertEquals(2, result.getStatus()); // pending approval
                verify(specMapper).updateById(spec);
                verify(workflowService).startProcess(
                        eq("MODULE_SPEC_APPROVAL"), eq(1L), eq("MODULE_SPEC"),
                        anyString(), isNull(), eq(1L));
            }
        }

        @Test
        @DisplayName("should throw when spec not found")
        void shouldThrowWhenSpecNotFound() {
            when(specMapper.selectById(999L)).thenReturn(null);

            assertThrows(BusinessException.class,
                    () -> moduleLibraryService.publishSpec(999L));
        }

        @Test
        @DisplayName("should throw when spec already published")
        void shouldThrowWhenAlreadyPublished() {
            ModuleSpec spec = buildSpec(1L, 1L);
            spec.setStatus(1); // already published
            when(specMapper.selectById(1L)).thenReturn(spec);

            assertThrows(BusinessException.class,
                    () -> moduleLibraryService.publishSpec(1L));
        }
    }
}
