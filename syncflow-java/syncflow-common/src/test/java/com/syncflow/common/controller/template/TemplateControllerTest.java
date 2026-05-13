package com.syncflow.common.controller.template;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.common.dto.template.CreateTemplateDTO;
import com.syncflow.common.dto.template.TemplateVO;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.service.template.TemplateService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TemplateController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("TemplateController")
class TemplateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TemplateService templateService;

    private TemplateVO buildTemplateVO(Long id) {
        return TemplateVO.builder()
                .id(id)
                .name("Template " + id)
                .description("Description " + id)
                .type("PROJECT")
                .content("{\"phases\":[]}")
                .category("DEFAULT")
                .creatorId(1L)
                .usageCount(5)
                .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .build();
    }

    // -----------------------------------------------------------------------
    //  GET /api/templates
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/templates")
    class GetTemplateListTests {

        @Test
        @DisplayName("should return paginated template list")
        void getTemplateList_success() throws Exception {
            PageResult<TemplateVO> pageResult = new PageResult<>(
                    List.of(buildTemplateVO(1L), buildTemplateVO(2L)),
                    2, 10, 1);
            when(templateService.getTemplateList(isNull(), eq(1), eq(10))).thenReturn(pageResult);

            mockMvc.perform(get("/api/templates")
                            .param("pageNum", "1")
                            .param("pageSize", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.records").isArray())
                    .andExpect(jsonPath("$.data.total").value(2));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/templates/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/templates/{id}")
    class GetTemplateDetailTests {

        @Test
        @DisplayName("should return template detail")
        void getTemplateDetail_success() throws Exception {
            when(templateService.getTemplateDetail(1L)).thenReturn(buildTemplateVO(1L));

            mockMvc.perform(get("/api/templates/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.name").value("Template 1"));
        }

        @Test
        @DisplayName("should return error when template not found")
        void getTemplateDetail_notFound() throws Exception {
            when(templateService.getTemplateDetail(99L))
                    .thenThrow(new BusinessException(ErrorCode.TEMPLATE_NOT_FOUND));

            mockMvc.perform(get("/api/templates/99"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.TEMPLATE_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/templates
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/templates")
    class CreateTemplateTests {

        @Test
        @DisplayName("should create template successfully")
        void createTemplate_success() throws Exception {
            CreateTemplateDTO dto = CreateTemplateDTO.builder()
                    .name("New Template")
                    .type("PROJECT")
                    .build();
            when(templateService.createTemplate(any(CreateTemplateDTO.class)))
                    .thenReturn(buildTemplateVO(1L));

            mockMvc.perform(post("/api/templates")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1));
        }
    }

    // -----------------------------------------------------------------------
    //  PATCH /api/templates/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PATCH /api/templates/{id}")
    class UpdateTemplateTests {

        @Test
        @DisplayName("should update template successfully")
        void updateTemplate_success() throws Exception {
            CreateTemplateDTO dto = CreateTemplateDTO.builder()
                    .name("Updated Template")
                    .build();
            when(templateService.updateTemplate(eq(1L), any(CreateTemplateDTO.class)))
                    .thenReturn(buildTemplateVO(1L));

            mockMvc.perform(patch("/api/templates/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));
        }
    }

    // -----------------------------------------------------------------------
    //  DELETE /api/templates/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/templates/{id}")
    class DeleteTemplateTests {

        @Test
        @DisplayName("should delete template")
        void deleteTemplate_success() throws Exception {
            doNothing().when(templateService).deleteTemplate(1L);

            mockMvc.perform(delete("/api/templates/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/templates/{id}/preview
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/templates/{id}/preview")
    class PreviewTemplateTests {

        @Test
        @DisplayName("should return template preview")
        void previewTemplate_success() throws Exception {
            when(templateService.previewTemplate(1L)).thenReturn(buildTemplateVO(1L));

            mockMvc.perform(get("/api/templates/1/preview"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/templates/{id}/apply
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/templates/{id}/apply")
    class ApplyTemplateTests {

        @Test
        @DisplayName("should apply template")
        void applyTemplate_success() throws Exception {
            doNothing().when(templateService).applyTemplate(1L);

            mockMvc.perform(post("/api/templates/1/apply"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/templates/{id}/duplicate
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/templates/{id}/duplicate")
    class DuplicateTemplateTests {

        @Test
        @DisplayName("should duplicate template")
        void duplicateTemplate_success() throws Exception {
            when(templateService.duplicateTemplate(1L)).thenReturn(buildTemplateVO(2L));

            mockMvc.perform(post("/api/templates/1/duplicate"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(2));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/templates/{id}/export
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/templates/{id}/export")
    class ExportTemplateTests {

        @Test
        @DisplayName("should export template as JSON")
        void exportTemplate_success() throws Exception {
            when(templateService.exportTemplate(1L)).thenReturn("{\"phases\":[]}");

            mockMvc.perform(get("/api/templates/1/export"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Disposition", "attachment; filename=template-1.json"));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/templates/import
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/templates/import")
    class ImportTemplateTests {

        @Test
        @DisplayName("should import template from JSON")
        void importTemplate_success() throws Exception {
            when(templateService.importTemplate(anyString())).thenReturn(buildTemplateVO(3L));

            mockMvc.perform(post("/api/templates/import")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"phases\":[]}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(3));
        }
    }
}
