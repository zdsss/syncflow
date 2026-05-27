package com.syncflow.config.controller.cfg;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.config.dto.*;
import com.syncflow.config.entity.ModuleCategory;
import com.syncflow.config.service.ModuleLibraryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ModuleLibraryController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class ModuleLibraryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ModuleLibraryService moduleLibraryService;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private CategoryTreeVO buildCategoryTreeVO() {
        CategoryTreeVO vo = new CategoryTreeVO();
        vo.setId(1L);
        vo.setName("Electronics");
        vo.setCode("ELEC");
        vo.setLevel(0);
        vo.setChildren(Collections.emptyList());
        return vo;
    }

    private ModuleVO buildModuleVO() {
        ModuleVO vo = new ModuleVO();
        vo.setId(1L);
        vo.setCode("MOD-01");
        vo.setName("Control Module");
        vo.setStatus(1);
        vo.setCategoryName("Electronics");
        return vo;
    }

    private SpecVO buildSpecVO() {
        SpecVO vo = new SpecVO();
        vo.setId(1L);
        vo.setSpecName("Spec A");
        vo.setCrossSection("20x30");
        vo.setMaterial("Steel");
        vo.setStatus("0");
        return vo;
    }

    private SpecParamVO buildSpecParamVO() {
        SpecParamVO vo = new SpecParamVO();
        vo.setId(1L);
        vo.setParamName("Diameter");
        vo.setParamType("DECIMAL");
        vo.setControlType("INPUT");
        vo.setUnit("mm");
        vo.setIsRequired(true);
        return vo;
    }

    // -----------------------------------------------------------------------
    //  GET /api/config/modules/categories
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/config/modules/categories")
    class GetCategoryTree {

        @Test
        @DisplayName("should return category tree with optional parentId")
        void shouldReturnCategoryTree() throws Exception {
            when(moduleLibraryService.getCategoryTree(1L))
                    .thenReturn(Collections.singletonList(buildCategoryTreeVO()));

            mockMvc.perform(get("/api/config/modules/categories")
                            .param("parentId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].name").value("Electronics"))
                    .andExpect(jsonPath("$.data[0].code").value("ELEC"));
        }

        @Test
        @DisplayName("should return empty list when no categories exist")
        void shouldReturnEmptyList() throws Exception {
            when(moduleLibraryService.getCategoryTree(isNull()))
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/config/modules/categories"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/config/modules/categories
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/config/modules/categories")
    class CreateCategory {

        @Test
        @DisplayName("should create a new module category")
        void shouldCreateCategory() throws Exception {
            ModuleCategory input = new ModuleCategory();
            input.setName("Hardware");
            input.setCode("HW");

            ModuleCategory saved = new ModuleCategory();
            saved.setId(2L);
            saved.setName("Hardware");
            saved.setCode("HW");

            when(moduleLibraryService.createCategory(any(ModuleCategory.class)))
                    .thenReturn(saved);

            mockMvc.perform(post("/api/config/modules/categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(input)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(2))
                    .andExpect(jsonPath("$.data.name").value("Hardware"))
                    .andExpect(jsonPath("$.data.code").value("HW"));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/config/modules
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/config/modules")
    class GetModulesByCategory {

        @Test
        @DisplayName("should return modules filtered by category")
        void shouldReturnModules() throws Exception {
            when(moduleLibraryService.getModulesByCategory(1L))
                    .thenReturn(Collections.singletonList(buildModuleVO()));

            mockMvc.perform(get("/api/config/modules")
                            .param("categoryId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].code").value("MOD-01"))
                    .andExpect(jsonPath("$.data[0].categoryName").value("Electronics"));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/config/modules
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/config/modules")
    class CreateModule {

        @Test
        @DisplayName("should create a new module")
        void shouldCreateModule() throws Exception {
            CreateModuleDTO dto = new CreateModuleDTO();
            dto.setName("Power Supply");
            dto.setCode("PS-01");
            dto.setCategoryId(1L);

            ModuleVO result = buildModuleVO();
            result.setName("Power Supply");
            result.setCode("PS-01");
            when(moduleLibraryService.createModule(any(CreateModuleDTO.class)))
                    .thenReturn(result);

            mockMvc.perform(post("/api/config/modules")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.name").value("Power Supply"));
        }

        @Test
        @DisplayName("should return 400 when name is blank")
        void shouldReturn400WhenNameBlank() throws Exception {
            CreateModuleDTO dto = new CreateModuleDTO();
            dto.setName("");
            dto.setCode("PS-01");

            mockMvc.perform(post("/api/config/modules")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40000));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/config/modules/{moduleId}/specs
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/config/modules/{moduleId}/specs")
    class GetSpecs {

        @Test
        @DisplayName("should return specs for a module")
        void shouldReturnSpecs() throws Exception {
            when(moduleLibraryService.getSpecs(1L))
                    .thenReturn(Collections.singletonList(buildSpecVO()));

            mockMvc.perform(get("/api/config/modules/1/specs"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].specName").value("Spec A"))
                    .andExpect(jsonPath("$.data[0].material").value("Steel"));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/config/modules/{moduleId}/specs
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/config/modules/{moduleId}/specs")
    class CreateSpec {

        @Test
        @DisplayName("should create a new spec for a module")
        void shouldCreateSpec() throws Exception {
            CreateSpecDTO dto = new CreateSpecDTO();
            dto.setSpecName("New Spec");
            dto.setCrossSection("10x20");
            dto.setMaterial("Aluminum");

            when(moduleLibraryService.createSpec(eq(1L), any(CreateSpecDTO.class)))
                    .thenReturn(buildSpecVO());

            mockMvc.perform(post("/api/config/modules/1/specs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1));
        }

        @Test
        @DisplayName("should return 400 when required spec fields are blank")
        void shouldReturn400WhenFieldsBlank() throws Exception {
            CreateSpecDTO dto = new CreateSpecDTO();
            dto.setSpecName("");
            dto.setCrossSection("");
            dto.setMaterial("");

            mockMvc.perform(post("/api/config/modules/1/specs")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40000));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/config/modules/specs/{specId}/params
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/config/modules/specs/{specId}/params")
    class GetSpecParams {

        @Test
        @DisplayName("should return params for a spec")
        void shouldReturnSpecParams() throws Exception {
            when(moduleLibraryService.getSpecParams(1L))
                    .thenReturn(Collections.singletonList(buildSpecParamVO()));

            mockMvc.perform(get("/api/config/modules/specs/1/params"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].paramName").value("Diameter"))
                    .andExpect(jsonPath("$.data[0].unit").value("mm"))
                    .andExpect(jsonPath("$.data[0].isRequired").value(true));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/config/modules/specs/{specId}/params
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/config/modules/specs/{specId}/params")
    class CreateSpecParam {

        @Test
        @DisplayName("should create a new spec parameter")
        void shouldCreateSpecParam() throws Exception {
            CreateSpecParamDTO dto = new CreateSpecParamDTO();
            dto.setParamName("Length");
            dto.setParamType("DECIMAL");
            dto.setControlType("INPUT");
            dto.setUnit("cm");

            when(moduleLibraryService.createSpecParam(eq(1L), any(CreateSpecParamDTO.class)))
                    .thenReturn(buildSpecParamVO());

            mockMvc.perform(post("/api/config/modules/specs/1/params")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.paramName").value("Diameter"));
        }

        @Test
        @DisplayName("should return 400 when paramName is blank")
        void shouldReturn400WhenParamNameBlank() throws Exception {
            CreateSpecParamDTO dto = new CreateSpecParamDTO();
            dto.setParamName("");

            mockMvc.perform(post("/api/config/modules/specs/1/params")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40000));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/config/modules/specs/{specId}/publish
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/config/modules/specs/{specId}/publish")
    class PublishSpec {

        @Test
        @DisplayName("should publish a spec")
        void shouldPublishSpec() throws Exception {
            SpecVO published = buildSpecVO();
            published.setStatus("1");
            when(moduleLibraryService.publishSpec(1L)).thenReturn(published);

            mockMvc.perform(post("/api/config/modules/specs/1/publish"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.status").value(1));

            verify(moduleLibraryService).publishSpec(1L);
        }
    }
}
