package com.syncflow.process.controller.prc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.process.dto.*;
import com.syncflow.process.service.ProcessRouteService;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProcessRouteController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class ProcessRouteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProcessRouteService processRouteService;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private ProcessRouteVO buildRouteVO() {
        ProcessRouteVO vo = new ProcessRouteVO();
        vo.setId(1L);
        vo.setRouteNo("PR-001");
        vo.setName("Route A");
        vo.setVersion("1.0");
        vo.setBomId(10L);
        vo.setProjectId(20L);
        vo.setStatus(1);
        vo.setIsLatest(true);
        vo.setTotalOperations(3);
        vo.setTotalManHours(new BigDecimal("12.5"));
        vo.setTotalMaterialCost(new BigDecimal("500.00"));
        vo.setCreatedBy(1L);
        vo.setCreatedAt(LocalDateTime.now());
        return vo;
    }

    private ProcessRouteDetailVO buildRouteDetailVO() {
        ProcessRouteDetailVO detail = new ProcessRouteDetailVO();
        detail.setId(1L);
        detail.setRouteNo("PR-001");
        detail.setName("Route A");
        detail.setVersion("1.0");
        detail.setBomId(10L);
        detail.setProjectId(20L);
        detail.setStatus(1);
        detail.setIsLatest(true);
        detail.setTotalOperations(1);
        detail.setTotalManHours(new BigDecimal("4.0"));
        detail.setOperations(Collections.singletonList(buildOperationVO()));
        return detail;
    }

    private OperationVO buildOperationVO() {
        OperationVO vo = new OperationVO();
        vo.setId(100L);
        vo.setRouteId(1L);
        vo.setSeqNo(1);
        vo.setOperationNo("OP-01");
        vo.setName("Cutting");
        vo.setStatus(1);
        vo.setCreatedAt(LocalDateTime.now());
        return vo;
    }

    // -----------------------------------------------------------------------
    //  GET /api/process-routes
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/process-routes")
    class GetRouteList {

        @Test
        @DisplayName("should return route list with filters")
        void shouldReturnRouteList() throws Exception {
            when(processRouteService.getRouteList(10L, 20L))
                    .thenReturn(Collections.singletonList(buildRouteVO()));

            mockMvc.perform(get("/api/process-routes")
                            .param("bomId", "10")
                            .param("projectId", "20"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.message").value("success"))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].routeNo").value("PR-001"))
                    .andExpect(jsonPath("$.data[0].name").value("Route A"))
                    .andExpect(jsonPath("$.timestamp").isNumber());
        }

        @Test
        @DisplayName("should return empty list when no routes exist")
        void shouldReturnEmptyList() throws Exception {
            when(processRouteService.getRouteList(isNull(), isNull()))
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/process-routes"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/process-routes/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/process-routes/{id}")
    class GetRouteDetail {

        @Test
        @DisplayName("should return route detail with operations")
        void shouldReturnRouteDetail() throws Exception {
            when(processRouteService.getRouteDetail(1L))
                    .thenReturn(buildRouteDetailVO());

            mockMvc.perform(get("/api/process-routes/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.routeNo").value("PR-001"))
                    .andExpect(jsonPath("$.data.operations").isArray())
                    .andExpect(jsonPath("$.data.operations[0].id").value(100));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/process-routes
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/process-routes")
    class CreateRoute {

        @Test
        @DisplayName("should create a new route")
        void shouldCreateRoute() throws Exception {
            CreateProcessRouteDTO dto = new CreateProcessRouteDTO();
            dto.setName("New Route");
            dto.setProjectId(20L);
            dto.setBomId(10L);

            ProcessRouteVO result = buildRouteVO();
            result.setName("New Route");
            when(processRouteService.createRoute(any(CreateProcessRouteDTO.class)))
                    .thenReturn(result);

            mockMvc.perform(post("/api/process-routes")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.name").value("New Route"));
        }

        @Test
        @DisplayName("should return 400 when name is blank")
        void shouldReturn400WhenNameBlank() throws Exception {
            CreateProcessRouteDTO dto = new CreateProcessRouteDTO();
            dto.setName("");

            mockMvc.perform(post("/api/process-routes")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40000));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/process-routes/{id}/operations
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/process-routes/{id}/operations")
    class AddOperation {

        @Test
        @DisplayName("should add an operation to a route")
        void shouldAddOperation() throws Exception {
            CreateOperationDTO dto = new CreateOperationDTO();
            dto.setName("Drilling");

            when(processRouteService.addOperation(eq(1L), any(CreateOperationDTO.class)))
                    .thenReturn(buildOperationVO());

            mockMvc.perform(post("/api/process-routes/1/operations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(100))
                    .andExpect(jsonPath("$.data.name").value("Cutting"));
        }

        @Test
        @DisplayName("should return 400 when operation name is blank")
        void shouldReturn400WhenNameBlank() throws Exception {
            CreateOperationDTO dto = new CreateOperationDTO();
            dto.setName("");

            mockMvc.perform(post("/api/process-routes/1/operations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40000));
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/process-routes/operations/{operationId}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/process-routes/operations/{operationId}")
    class UpdateOperation {

        @Test
        @DisplayName("should update an existing operation")
        void shouldUpdateOperation() throws Exception {
            CreateOperationDTO dto = new CreateOperationDTO();
            dto.setName("Updated Name");

            OperationVO updated = buildOperationVO();
            updated.setName("Updated Name");
            when(processRouteService.updateOperation(eq(100L), any(CreateOperationDTO.class)))
                    .thenReturn(updated);

            mockMvc.perform(put("/api/process-routes/operations/100")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.name").value("Updated Name"));
        }
    }

    // -----------------------------------------------------------------------
    //  DELETE /api/process-routes/operations/{operationId}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/process-routes/operations/{operationId}")
    class DeleteOperation {

        @Test
        @DisplayName("should delete an operation")
        void shouldDeleteOperation() throws Exception {
            mockMvc.perform(delete("/api/process-routes/operations/100"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").doesNotExist());

            verify(processRouteService).deleteOperation(100L);
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/process-routes/{id}/operations/reorder
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/process-routes/{id}/operations/reorder")
    class ReorderOperations {

        @Test
        @DisplayName("should reorder operations")
        void shouldReorderOperations() throws Exception {
            List<Long> ids = List.of(3L, 1L, 2L);

            mockMvc.perform(put("/api/process-routes/1/operations/reorder")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(ids)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(processRouteService).reorderOperations(1L, ids);
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/process-routes/{id}/submit-approval
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/process-routes/{id}/submit-approval")
    class SubmitForApproval {

        @Test
        @DisplayName("should submit route for approval")
        void shouldSubmitForApproval() throws Exception {
            mockMvc.perform(post("/api/process-routes/1/submit-approval"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(processRouteService).submitForApproval(1L);
        }
    }
}
