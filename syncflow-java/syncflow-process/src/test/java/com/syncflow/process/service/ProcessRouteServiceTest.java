package com.syncflow.process.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.process.dto.*;
import com.syncflow.process.entity.ManHour;
import com.syncflow.process.entity.Operation;
import com.syncflow.process.entity.ProcessRoute;
import com.syncflow.process.mapper.ManHourMapper;
import com.syncflow.process.mapper.OperationMapper;
import com.syncflow.process.mapper.OperationMaterialMapper;
import com.syncflow.process.mapper.ProcessRouteMapper;
import com.syncflow.process.service.impl.ProcessRouteServiceImpl;
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
@DisplayName("ProcessRouteService")
class ProcessRouteServiceTest {

    @Mock
    private ProcessRouteMapper routeMapper;

    @Mock
    private OperationMapper operationMapper;

    @Mock
    private ManHourMapper manHourMapper;

    @Mock
    private OperationMaterialMapper operationMaterialMapper;

    @Mock
    private WorkflowService workflowService;

    @InjectMocks
    private ProcessRouteServiceImpl processRouteService;

    private ProcessRoute buildRoute(Long id, String name) {
        ProcessRoute route = new ProcessRoute();
        route.setId(id);
        route.setRouteNo("PRC-20260507-" + String.format("%03d", id));
        route.setName(name);
        route.setVersion("1.0");
        route.setBomId(1L);
        route.setProjectId(1L);
        route.setStatus(1); // draft
        route.setIsLatest(true);
        route.setTotalOperations(0);
        route.setTotalManHours(BigDecimal.ZERO);
        route.setTotalMaterialCost(BigDecimal.ZERO);
        route.setCreatedBy(1L);
        return route;
    }

    private Operation buildOperation(Long id, Long routeId) {
        Operation op = new Operation();
        op.setId(id);
        op.setRouteId(routeId);
        op.setSeqNo(10);
        op.setOperationNo("0010");
        op.setName("Operation " + id);
        op.setStatus(1);
        return op;
    }

    // -----------------------------------------------------------------------
    //  getRouteList
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getRouteList()")
    class GetRouteList {

        @Test
        @DisplayName("should return list of routes")
        void shouldReturnListOfRoutes() {
            ProcessRoute route = buildRoute(1L, "Route 1");
            when(routeMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(route));

            List<ProcessRouteVO> result = processRouteService.getRouteList(1L, null);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("Route 1", result.get(0).getName());
            verify(routeMapper).selectList(any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("should return empty list when no routes")
        void shouldReturnEmptyList() {
            when(routeMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());

            List<ProcessRouteVO> result = processRouteService.getRouteList(null, null);

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  getRouteDetail
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getRouteDetail()")
    class GetRouteDetail {

        @Test
        @DisplayName("should return route detail with operations")
        void shouldReturnRouteDetail() {
            ProcessRoute route = buildRoute(1L, "Route 1");
            Operation op = buildOperation(1L, 1L);

            when(routeMapper.selectById(1L)).thenReturn(route);
            when(operationMapper.selectByRouteId(1L)).thenReturn(List.of(op));

            ProcessRouteDetailVO result = processRouteService.getRouteDetail(1L);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals("Route 1", result.getName());
            assertNotNull(result.getOperations());
            assertEquals(1, result.getOperations().size());
            assertEquals("Operation 1", result.getOperations().get(0).getName());
            verify(routeMapper).selectById(1L);
        }

        @Test
        @DisplayName("should throw when route not found")
        void shouldThrowWhenRouteNotFound() {
            when(routeMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> processRouteService.getRouteDetail(999L));
            assertTrue(ex.getMessage().contains("工艺路线不存在")
                    || ex.getMessage().contains("not found"));
        }
    }

    // -----------------------------------------------------------------------
    //  createRoute
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("createRoute()")
    class CreateRoute {

        @Test
        @DisplayName("should create new process route")
        void shouldCreateRoute() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::getUserId).thenReturn(1L);

                CreateProcessRouteDTO dto = new CreateProcessRouteDTO();
                dto.setName("New Route");
                dto.setBomId(1L);
                dto.setProjectId(1L);
                dto.setProductCode("PROD-001");
                dto.setProductName("Product 1");

                when(routeMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
                when(routeMapper.insert(any(ProcessRoute.class))).thenReturn(1);

                ProcessRouteVO result = processRouteService.createRoute(dto);

                assertNotNull(result);
                assertEquals("New Route", result.getName());
                assertEquals("1.0", result.getVersion());
                assertEquals(1, result.getStatus()); // draft
                verify(routeMapper).insert(any(ProcessRoute.class));
            }
        }
    }

    // -----------------------------------------------------------------------
    //  addOperation
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("addOperation()")
    class AddOperation {

        @Test
        @DisplayName("should add operation to route")
        void shouldAddOperation() {
            ProcessRoute route = buildRoute(1L, "Route 1");
            when(routeMapper.selectById(1L)).thenReturn(route);
            when(operationMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(operationMapper.insert(any(Operation.class))).thenReturn(1);
            // recalculateRouteTotals — empty operations, so no manHour queries needed
            when(operationMapper.selectByRouteId(1L)).thenReturn(Collections.emptyList());
            when(routeMapper.updateById(any(ProcessRoute.class))).thenReturn(1);

            CreateOperationDTO dto = new CreateOperationDTO();
            dto.setName("Cutting");

            OperationVO result = processRouteService.addOperation(1L, dto);

            assertNotNull(result);
            assertEquals("Cutting", result.getName());
            assertEquals(10, result.getSeqNo());
            assertEquals("0010", result.getOperationNo());
            verify(operationMapper).insert(any(Operation.class));
        }

        @Test
        @DisplayName("should throw when route not found")
        void shouldThrowWhenRouteNotFound() {
            when(routeMapper.selectById(999L)).thenReturn(null);

            CreateOperationDTO dto = new CreateOperationDTO();
            dto.setName("Cutting");

            assertThrows(BusinessException.class,
                    () -> processRouteService.addOperation(999L, dto));
        }
    }

    // -----------------------------------------------------------------------
    //  updateOperation
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("updateOperation()")
    class UpdateOperation {

        @Test
        @DisplayName("should update operation fields")
        void shouldUpdateOperation() {
            Operation existing = buildOperation(1L, 1L);
            existing.setName("Old Name");
            when(operationMapper.selectById(1L)).thenReturn(existing);
            when(operationMapper.updateById(any(Operation.class))).thenReturn(1);
            ProcessRoute route = buildRoute(1L, "Route 1");
            when(routeMapper.selectById(1L)).thenReturn(route);
            when(operationMapper.selectByRouteId(1L)).thenReturn(List.of(existing));
            when(manHourMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());
            when(routeMapper.updateById(any(ProcessRoute.class))).thenReturn(1);

            CreateOperationDTO dto = new CreateOperationDTO();
            dto.setName("Updated Name");

            OperationVO result = processRouteService.updateOperation(1L, dto);

            assertNotNull(result);
            assertEquals("Updated Name", result.getName());
            verify(operationMapper).updateById(any(Operation.class));
        }

        @Test
        @DisplayName("should throw when operation not found")
        void shouldThrowWhenOperationNotFound() {
            when(operationMapper.selectById(999L)).thenReturn(null);

            CreateOperationDTO dto = new CreateOperationDTO();
            dto.setName("Cutting");

            assertThrows(BusinessException.class,
                    () -> processRouteService.updateOperation(999L, dto));
        }
    }

    // -----------------------------------------------------------------------
    //  deleteOperation
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("deleteOperation()")
    class DeleteOperation {

        @Test
        @DisplayName("should delete operation and its man-hours")
        void shouldDeleteOperation() {
            Operation existing = buildOperation(1L, 1L);
            when(operationMapper.selectById(1L)).thenReturn(existing);
            when(manHourMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            when(operationMaterialMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            when(operationMapper.deleteById(1L)).thenReturn(1);
            // Remaining operations for reordering
            when(operationMapper.selectByRouteId(1L)).thenReturn(Collections.emptyList());
            ProcessRoute route = buildRoute(1L, "Route 1");
            when(routeMapper.selectById(1L)).thenReturn(route);
            when(routeMapper.updateById(any(ProcessRoute.class))).thenReturn(1);

            processRouteService.deleteOperation(1L);

            verify(operationMapper).deleteById(1L);
            verify(manHourMapper).delete(any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("should throw when operation not found")
        void shouldThrowWhenOperationNotFound() {
            when(operationMapper.selectById(999L)).thenReturn(null);

            assertThrows(BusinessException.class,
                    () -> processRouteService.deleteOperation(999L));
        }
    }

    // -----------------------------------------------------------------------
    //  reorderOperations
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("reorderOperations()")
    class ReorderOperations {

        @Test
        @DisplayName("should reorder operations by seqNo")
        void shouldReorderOperations() {
            ProcessRoute route = buildRoute(1L, "Route 1");
            when(routeMapper.selectById(1L)).thenReturn(route);

            Operation op1 = buildOperation(1L, 1L);
            Operation op2 = buildOperation(2L, 1L);
            when(operationMapper.selectById(1L)).thenReturn(op1);
            when(operationMapper.selectById(2L)).thenReturn(op2);
            when(operationMapper.updateById(any(Operation.class))).thenReturn(1);

            processRouteService.reorderOperations(1L, List.of(2L, 1L));

            // First in list gets seqNo 10, second gets 20
            assertEquals(10, op2.getSeqNo());
            assertEquals("0010", op2.getOperationNo());
            assertEquals(20, op1.getSeqNo());
            assertEquals("0020", op1.getOperationNo());
            verify(operationMapper, times(2)).updateById(any(Operation.class));
        }

        @Test
        @DisplayName("should throw when operation does not belong to route")
        void shouldThrowWhenOperationNotInRoute() {
            ProcessRoute route = buildRoute(1L, "Route 1");
            when(routeMapper.selectById(1L)).thenReturn(route);

            Operation foreignOp = buildOperation(99L, 2L); // belongs to route 2
            when(operationMapper.selectById(99L)).thenReturn(foreignOp);

            assertThrows(BusinessException.class,
                    () -> processRouteService.reorderOperations(1L, List.of(99L)));
        }
    }
}
