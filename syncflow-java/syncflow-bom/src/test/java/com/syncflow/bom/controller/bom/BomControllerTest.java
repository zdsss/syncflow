package com.syncflow.bom.controller.bom;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.bom.dto.*;
import com.syncflow.bom.service.BomService;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.workflow.service.ChangeRequestService;
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
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BomController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("BomController")
class BomControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BomService bomService;

    @MockBean
    private ChangeRequestService changeRequestService;

    @MockBean
    private com.syncflow.workflow.service.WorkflowService workflowService;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private BomVO buildBomVO(Long id) {
        BomVO vo = new BomVO();
        vo.setId(id);
        vo.setBomNo("BOM-" + id);
        vo.setName("BOM " + id);
        vo.setVersion("v1.0");
        vo.setProjectId(1L);
        vo.setProductCode("PROD-001");
        vo.setProductName("Product 1");
        vo.setStatus(1);
        vo.setStatusName("Editing");
        vo.setIsLatest(true);
        vo.setTotalItems(10);
        vo.setTotalWeight(new BigDecimal("150.5"));
        vo.setCreatedBy(1L);
        vo.setCreatedByName("Admin");
        vo.setProjectName("Project 1");
        vo.setCreatedAt(LocalDateTime.of(2026, 1, 1, 0, 0));
        return vo;
    }

    private BomItemTreeVO buildBomItemTreeVO(Long id) {
        BomItemTreeVO vo = new BomItemTreeVO();
        vo.setId(id);
        vo.setBomId(1L);
        vo.setLevel(0);
        vo.setSeqNo(1);
        vo.setMaterialCode("MAT-" + id);
        vo.setName("Item " + id);
        vo.setSpecification("Spec " + id);
        vo.setUnit("pcs");
        vo.setQuantity(new BigDecimal("1"));
        vo.setSourceType("MADE");
        return vo;
    }

    private BomVersionVO buildBomVersionVO(Long id) {
        BomVersionVO vo = new BomVersionVO();
        vo.setId(id);
        vo.setBomId(1L);
        vo.setVersion("v" + id + ".0");
        vo.setChangeSummary("Change " + id);
        vo.setCreatedBy(1L);
        vo.setCreatedByName("Admin");
        vo.setCreatedAt(LocalDateTime.of(2026, 1, id.intValue(), 0, 0));
        return vo;
    }

    // -----------------------------------------------------------------------
    //  GET /api/boms
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/boms")
    class ListBomsTests {

        @Test
        @DisplayName("should list all BOMs")
        void listBoms_success() throws Exception {
            List<BomVO> boms = List.of(buildBomVO(1L), buildBomVO(2L));
            when(bomService.listBoms(isNull())).thenReturn(boms);

            mockMvc.perform(get("/api/boms"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data.length()").value(2))
                    .andExpect(jsonPath("$.data[0].bomNo").value("BOM-1"))
                    .andExpect(jsonPath("$.data[0].name").value("BOM 1"));

            verify(bomService).listBoms(isNull());
        }

        @Test
        @DisplayName("should filter BOMs by project ID")
        void listBoms_byProject() throws Exception {
            List<BomVO> boms = List.of(buildBomVO(1L));
            when(bomService.listBoms(1L)).thenReturn(boms);

            mockMvc.perform(get("/api/boms")
                            .param("projectId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.length()").value(1));

            verify(bomService).listBoms(1L);
        }

        @Test
        @DisplayName("should return empty list when no BOMs exist")
        void listBoms_empty() throws Exception {
            when(bomService.listBoms(isNull())).thenReturn(List.of());

            mockMvc.perform(get("/api/boms"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/boms/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/boms/{id}")
    class GetBomDetailTests {

        @Test
        @DisplayName("should return BOM detail")
        void getBomDetail_success() throws Exception {
            when(bomService.getBomDetail(1L)).thenReturn(buildBomVO(1L));

            mockMvc.perform(get("/api/boms/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.bomNo").value("BOM-1"))
                    .andExpect(jsonPath("$.data.name").value("BOM 1"))
                    .andExpect(jsonPath("$.data.version").value("v1.0"))
                    .andExpect(jsonPath("$.data.totalItems").value(10));

            verify(bomService).getBomDetail(1L);
        }

        @Test
        @DisplayName("should return error when BOM not found")
        void getBomDetail_notFound() throws Exception {
            when(bomService.getBomDetail(99L))
                    .thenThrow(new BusinessException(ErrorCode.BOM_NOT_FOUND));

            mockMvc.perform(get("/api/boms/99"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.BOM_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/boms/{id}/structure
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/boms/{id}/structure")
    class GetBomStructureTests {

        @Test
        @DisplayName("should return BOM item tree structure")
        void getBomStructure_success() throws Exception {
            BomItemTreeVO root = buildBomItemTreeVO(1L);
            BomItemTreeVO child = buildBomItemTreeVO(2L);
            child.setLevel(1);
            child.setParentId(1L);
            root.setChildren(List.of(child));

            when(bomService.getBomStructure(1L)).thenReturn(List.of(root));

            mockMvc.perform(get("/api/boms/1/structure"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].name").value("Item 1"))
                    .andExpect(jsonPath("$.data[0].children[0].name").value("Item 2"));

            verify(bomService).getBomStructure(1L);
        }

        @Test
        @DisplayName("should return error when BOM not found")
        void getBomStructure_notFound() throws Exception {
            when(bomService.getBomStructure(99L))
                    .thenThrow(new BusinessException(ErrorCode.BOM_NOT_FOUND));

            mockMvc.perform(get("/api/boms/99/structure"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.BOM_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/boms
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/boms")
    class CreateBomTests {

        @Test
        @DisplayName("should create BOM successfully")
        void createBom_success() throws Exception {
            CreateBomDTO dto = new CreateBomDTO();
            dto.setName("New BOM");
            dto.setProjectId(1L);
            dto.setProductCode("PROD-NEW");
            dto.setProductName("New Product");

            BomVO result = buildBomVO(1L);
            when(bomService.createBom(any(CreateBomDTO.class))).thenReturn(result);

            mockMvc.perform(post("/api/boms")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.bomNo").value("BOM-1"));

            verify(bomService).createBom(any(CreateBomDTO.class));
        }

        @Test
        @DisplayName("should return error when project not found")
        void createBom_projectNotFound() throws Exception {
            CreateBomDTO dto = new CreateBomDTO();
            dto.setName("BOM");
            dto.setProjectId(99L);

            when(bomService.createBom(any(CreateBomDTO.class)))
                    .thenThrow(new BusinessException(ErrorCode.PROJECT_NOT_FOUND));

            mockMvc.perform(post("/api/boms")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.PROJECT_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/boms/{id}/items
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/boms/{id}/items")
    class AddBomItemTests {

        @Test
        @DisplayName("should add BOM item successfully")
        void addBomItem_success() throws Exception {
            CreateBomItemDTO dto = new CreateBomItemDTO();
            dto.setName("New Part");
            dto.setSourceType("MADE");
            dto.setQuantity(new BigDecimal("5"));

            BomItemTreeVO result = buildBomItemTreeVO(1L);
            when(bomService.addBomItem(eq(1L), any(CreateBomItemDTO.class))).thenReturn(result);

            mockMvc.perform(post("/api/boms/1/items")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.name").value("Item 1"));

            verify(bomService).addBomItem(eq(1L), any(CreateBomItemDTO.class));
        }

        @Test
        @DisplayName("should return error when BOM not found or cannot modify")
        void addBomItem_cannotModify() throws Exception {
            CreateBomItemDTO dto = new CreateBomItemDTO();
            dto.setName("New Part");
            dto.setSourceType("MADE");

            when(bomService.addBomItem(eq(99L), any(CreateBomItemDTO.class)))
                    .thenThrow(new BusinessException(ErrorCode.BOM_NOT_FOUND));

            mockMvc.perform(post("/api/boms/99/items")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.BOM_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/boms/items/{itemId}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/boms/items/{itemId}")
    class UpdateBomItemTests {

        @Test
        @DisplayName("should update BOM item successfully")
        void updateBomItem_success() throws Exception {
            CreateBomItemDTO dto = new CreateBomItemDTO();
            dto.setName("Updated Part");
            dto.setSourceType("PURCHASED");
            dto.setQuantity(new BigDecimal("10"));

            BomItemTreeVO result = buildBomItemTreeVO(1L);
            when(bomService.updateBomItem(eq(1L), any(CreateBomItemDTO.class))).thenReturn(result);

            mockMvc.perform(put("/api/boms/items/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isNotEmpty());

            verify(bomService).updateBomItem(eq(1L), any(CreateBomItemDTO.class));
        }

        @Test
        @DisplayName("should return error when BOM item not found")
        void updateBomItem_notFound() throws Exception {
            CreateBomItemDTO dto = new CreateBomItemDTO();
            dto.setName("Ghost Item");
            dto.setSourceType("MADE");

            when(bomService.updateBomItem(eq(99L), any(CreateBomItemDTO.class)))
                    .thenThrow(new BusinessException(ErrorCode.BOM_NOT_FOUND));

            mockMvc.perform(put("/api/boms/items/99")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.BOM_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  DELETE /api/boms/items/{itemId}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/boms/items/{itemId}")
    class DeleteBomItemTests {

        @Test
        @DisplayName("should delete BOM item")
        void deleteBomItem_success() throws Exception {
            doNothing().when(bomService).deleteBomItem(1L);

            mockMvc.perform(delete("/api/boms/items/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(bomService).deleteBomItem(1L);
        }

        @Test
        @DisplayName("should return error when BOM cannot be modified")
        void deleteBomItem_cannotModify() throws Exception {
            doThrow(new BusinessException(ErrorCode.BOM_CANNOT_MODIFY))
                    .when(bomService).deleteBomItem(1L);

            mockMvc.perform(delete("/api/boms/items/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.BOM_CANNOT_MODIFY.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/boms/{id}/submit-approval
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/boms/{id}/submit-approval")
    class SubmitForApprovalTests {

        @Test
        @DisplayName("should submit BOM for approval")
        void submitForApproval_success() throws Exception {
            doNothing().when(bomService).submitForApproval(1L);

            mockMvc.perform(post("/api/boms/1/submit-approval"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(bomService).submitForApproval(1L);
        }

        @Test
        @DisplayName("should return error when BOM already pending approval")
        void submitForApproval_alreadyPending() throws Exception {
            doThrow(new BusinessException(ErrorCode.BOM_PENDING_APPROVAL))
                    .when(bomService).submitForApproval(1L);

            mockMvc.perform(post("/api/boms/1/submit-approval"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.BOM_PENDING_APPROVAL.getCode()));
        }

        @Test
        @DisplayName("should return error when BOM already published")
        void submitForApproval_alreadyPublished() throws Exception {
            doThrow(new BusinessException(ErrorCode.BOM_ALREADY_PUBLISHED))
                    .when(bomService).submitForApproval(1L);

            mockMvc.perform(post("/api/boms/1/submit-approval"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.BOM_ALREADY_PUBLISHED.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/boms/{id}/save-version
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/boms/{id}/save-version")
    class SaveVersionTests {

        @Test
        @DisplayName("should save BOM version")
        void saveVersion_success() throws Exception {
            BomVO versionResult = buildBomVO(2L);
            versionResult.setVersion("v2.0");
            when(bomService.saveVersion(eq(1L), eq("Added new items"))).thenReturn(versionResult);

            mockMvc.perform(post("/api/boms/1/save-version")
                            .param("changeSummary", "Added new items"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.version").value("v2.0"));

            verify(bomService).saveVersion(eq(1L), eq("Added new items"));
        }

        @Test
        @DisplayName("should save BOM version without change summary")
        void saveVersion_noSummary() throws Exception {
            BomVO versionResult = buildBomVO(2L);
            when(bomService.saveVersion(eq(1L), isNull())).thenReturn(versionResult);

            mockMvc.perform(post("/api/boms/1/save-version"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isNotEmpty());

            verify(bomService).saveVersion(eq(1L), isNull());
        }

        @Test
        @DisplayName("should return error when BOM not found")
        void saveVersion_notFound() throws Exception {
            when(bomService.saveVersion(eq(99L), isNull()))
                    .thenThrow(new BusinessException(ErrorCode.BOM_NOT_FOUND));

            mockMvc.perform(post("/api/boms/99/save-version"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.BOM_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/boms/{id}/versions
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/boms/{id}/versions")
    class GetVersionHistoryTests {

        @Test
        @DisplayName("should return version history")
        void getVersionHistory_success() throws Exception {
            List<BomVersionVO> versions = List.of(
                    buildBomVersionVO(1L),
                    buildBomVersionVO(2L),
                    buildBomVersionVO(3L)
            );
            when(bomService.getVersionHistory(1L)).thenReturn(versions);

            mockMvc.perform(get("/api/boms/1/versions"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data.length()").value(3))
                    .andExpect(jsonPath("$.data[0].version").value("v1.0"))
                    .andExpect(jsonPath("$.data[0].changeSummary").value("Change 1"));

            verify(bomService).getVersionHistory(1L);
        }

        @Test
        @DisplayName("should return error when BOM not found")
        void getVersionHistory_notFound() throws Exception {
            when(bomService.getVersionHistory(99L))
                    .thenThrow(new BusinessException(ErrorCode.BOM_NOT_FOUND));

            mockMvc.perform(get("/api/boms/99/versions"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.BOM_NOT_FOUND.getCode()));
        }
    }
}
