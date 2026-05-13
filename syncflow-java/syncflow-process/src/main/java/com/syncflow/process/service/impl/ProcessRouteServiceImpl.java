package com.syncflow.process.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.process.dto.*;
import com.syncflow.process.entity.ManHour;
import com.syncflow.process.entity.Operation;
import com.syncflow.process.entity.OperationMaterial;
import com.syncflow.process.entity.ProcessRoute;
import com.syncflow.process.entity.RouteVersion;
import com.syncflow.process.mapper.ManHourMapper;
import com.syncflow.process.mapper.OperationMapper;
import com.syncflow.process.mapper.OperationMaterialMapper;
import com.syncflow.process.mapper.ProcessRouteMapper;
import com.syncflow.process.mapper.RouteVersionMapper;
import com.syncflow.process.service.ProcessRouteService;
import com.syncflow.workflow.service.ChangeApprovalInterceptor;
import com.syncflow.workflow.service.WorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Process route management service implementation.
 */
@Service
public class ProcessRouteServiceImpl implements ProcessRouteService {

    private final ProcessRouteMapper routeMapper;
    private final OperationMapper operationMapper;
    private final ManHourMapper manHourMapper;
    private final OperationMaterialMapper operationMaterialMapper;
    private final RouteVersionMapper routeVersionMapper;
    private final WorkflowService workflowService;

    @Lazy
    private ChangeApprovalInterceptor changeInterceptor;

    @Autowired
    public void setChangeInterceptor(@Lazy ChangeApprovalInterceptor changeInterceptor) {
        this.changeInterceptor = changeInterceptor;
    }

    public ProcessRouteServiceImpl(ProcessRouteMapper routeMapper,
                                   OperationMapper operationMapper,
                                   ManHourMapper manHourMapper,
                                   OperationMaterialMapper operationMaterialMapper,
                                   RouteVersionMapper routeVersionMapper,
                                   WorkflowService workflowService) {
        this.routeMapper = routeMapper;
        this.operationMapper = operationMapper;
        this.manHourMapper = manHourMapper;
        this.operationMaterialMapper = operationMaterialMapper;
        this.routeVersionMapper = routeVersionMapper;
        this.workflowService = workflowService;
    }

    // -----------------------------------------------------------------------
    //  List
    // -----------------------------------------------------------------------

    @Override
    public List<ProcessRouteVO> getRouteList(Long bomId, Long projectId) {
        LambdaQueryWrapper<ProcessRoute> wrapper = new LambdaQueryWrapper<>();
        if (bomId != null) {
            wrapper.eq(ProcessRoute::getBomId, bomId);
        }
        if (projectId != null) {
            wrapper.eq(ProcessRoute::getProjectId, projectId);
        }
        wrapper.orderByDesc(ProcessRoute::getCreatedAt);

        return routeMapper.selectList(wrapper).stream()
                .map(this::toRouteVO)
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    //  Detail
    // -----------------------------------------------------------------------

    @Override
    public ProcessRouteDetailVO getRouteDetail(Long id) {
        ProcessRoute route = getRouteOrThrow(id);
        ProcessRouteDetailVO vo = toRouteDetailVO(route);

        List<Operation> operations = operationMapper.selectByRouteId(id);
        vo.setOperations(operations.stream()
                .map(this::toOperationVO)
                .collect(Collectors.toList()));

        return vo;
    }

    // -----------------------------------------------------------------------
    //  Create
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public ProcessRouteVO createRoute(CreateProcessRouteDTO dto) {
        Long currentUserId = SecurityUtils.getUserId();

        ProcessRoute route = new ProcessRoute();
        route.setRouteNo(generateRouteNo());
        route.setName(dto.getName());
        route.setVersion("1.0");
        route.setBomId(dto.getBomId());
        route.setProjectId(dto.getProjectId());
        route.setProductCode(dto.getProductCode());
        route.setProductName(dto.getProductName());
        route.setStatus(1); // draft
        route.setIsLatest(true);
        route.setTotalOperations(0);
        route.setTotalManHours(BigDecimal.ZERO);
        route.setTotalMaterialCost(BigDecimal.ZERO);
        route.setCreatedBy(currentUserId);

        routeMapper.insert(route);

        return toRouteVO(route);
    }

    // -----------------------------------------------------------------------
    //  Add Operation
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public OperationVO addOperation(Long routeId, CreateOperationDTO dto) {
        ensureRouteEditable(routeId, "ADD_OPERATION", dto);
        ProcessRoute route = getRouteOrThrow(routeId);

        // Calculate next seqNo
        LambdaQueryWrapper<Operation> countWrapper = new LambdaQueryWrapper<>();
        countWrapper.eq(Operation::getRouteId, routeId);
        Long existingCount = operationMapper.selectCount(countWrapper);
        int nextSeq = ((existingCount != null ? existingCount.intValue() : 0) + 1) * 10;

        Operation operation = new Operation();
        operation.setRouteId(routeId);
        operation.setSeqNo(nextSeq);
        operation.setOperationNo(String.format("%04d", nextSeq));
        operation.setName(dto.getName());
        operation.setDescription(dto.getDescription());
        operation.setMaterialCode(dto.getMaterialCode());
        operation.setMaterialName(dto.getMaterialName());
        operation.setDrawingNo(dto.getDrawingNo());
        operation.setSourceType(dto.getSourceType());
        operation.setIsVirtual(dto.getIsVirtual() != null ? dto.getIsVirtual() : false);
        operation.setWorkCenterCode(dto.getWorkCenterCode());
        operation.setWorkCenterName(dto.getWorkCenterName());
        operation.setStatus(1); // active

        operationMapper.insert(operation);

        // Insert man-hours
        if (dto.getManHours() != null) {
            for (CreateManHourDTO mhDto : dto.getManHours()) {
                ManHour manHour = new ManHour();
                manHour.setOperationId(operation.getId());
                manHour.setWorkType(mhDto.getWorkType());
                manHour.setHours(mhDto.getHours());
                manHour.setWorkerCount(mhDto.getWorkerCount());
                manHour.setIsCritical(mhDto.getIsCritical() != null ? mhDto.getIsCritical() : false);
                manHour.setRemark(mhDto.getRemark());
                manHourMapper.insert(manHour);
            }
        }

        // Update route totals
        recalculateRouteTotals(route);

        return toOperationVO(operation);
    }

    // -----------------------------------------------------------------------
    //  Update Operation
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public OperationVO updateOperation(Long operationId, CreateOperationDTO dto) {
        Operation operation = getOperationOrThrow(operationId);
        ensureRouteEditable(operation.getRouteId(), "UPDATE_OPERATION", dto);

        operation.setName(dto.getName());
        operation.setDescription(dto.getDescription());
        operation.setMaterialCode(dto.getMaterialCode());
        operation.setMaterialName(dto.getMaterialName());
        operation.setDrawingNo(dto.getDrawingNo());
        operation.setSourceType(dto.getSourceType());
        if (dto.getIsVirtual() != null) {
            operation.setIsVirtual(dto.getIsVirtual());
        }
        operation.setWorkCenterCode(dto.getWorkCenterCode());
        operation.setWorkCenterName(dto.getWorkCenterName());

        operationMapper.updateById(operation);

        // Replace man-hours: delete existing, insert new
        if (dto.getManHours() != null) {
            LambdaQueryWrapper<ManHour> deleteWrapper = new LambdaQueryWrapper<>();
            deleteWrapper.eq(ManHour::getOperationId, operationId);
            manHourMapper.delete(deleteWrapper);

            for (CreateManHourDTO mhDto : dto.getManHours()) {
                ManHour manHour = new ManHour();
                manHour.setOperationId(operationId);
                manHour.setWorkType(mhDto.getWorkType());
                manHour.setHours(mhDto.getHours());
                manHour.setWorkerCount(mhDto.getWorkerCount());
                manHour.setIsCritical(mhDto.getIsCritical() != null ? mhDto.getIsCritical() : false);
                manHour.setRemark(mhDto.getRemark());
                manHourMapper.insert(manHour);
            }
        }

        // Update route totals
        ProcessRoute route = getRouteOrThrow(operation.getRouteId());
        recalculateRouteTotals(route);

        return toOperationVO(operation);
    }

    // -----------------------------------------------------------------------
    //  Delete Operation
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public void deleteOperation(Long operationId) {
        Operation operation = getOperationOrThrow(operationId);
        ensureRouteEditable(operation.getRouteId(), "DELETE_OPERATION", java.util.Map.of("operationId", operationId));
        Long routeId = operation.getRouteId();

        // Delete associated man-hours
        LambdaQueryWrapper<ManHour> mhWrapper = new LambdaQueryWrapper<>();
        mhWrapper.eq(ManHour::getOperationId, operationId);
        manHourMapper.delete(mhWrapper);

        // Delete associated materials
        LambdaQueryWrapper<OperationMaterial> matWrapper = new LambdaQueryWrapper<>();
        matWrapper.eq(OperationMaterial::getOperationId, operationId);
        operationMaterialMapper.delete(matWrapper);

        // Delete the operation
        operationMapper.deleteById(operationId);

        // Recalculate remaining operations seqNos
        List<Operation> remaining = operationMapper.selectByRouteId(routeId);
        for (int i = 0; i < remaining.size(); i++) {
            Operation op = remaining.get(i);
            int newSeq = (i + 1) * 10;
            op.setSeqNo(newSeq);
            op.setOperationNo(String.format("%04d", newSeq));
            operationMapper.updateById(op);
        }

        // Update route totals
        ProcessRoute route = getRouteOrThrow(routeId);
        recalculateRouteTotals(route);
    }

    // -----------------------------------------------------------------------
    //  Reorder Operations
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public void reorderOperations(Long routeId, List<Long> operationIds) {
        getRouteOrThrow(routeId);

        for (int i = 0; i < operationIds.size(); i++) {
            Operation operation = operationMapper.selectById(operationIds.get(i));
            if (operation == null || !operation.getRouteId().equals(routeId)) {
                throw new BusinessException(ErrorCode.PARAM_ERROR,
                        "Operation " + operationIds.get(i) + " does not belong to route " + routeId);
            }
            int newSeq = (i + 1) * 10;
            operation.setSeqNo(newSeq);
            operation.setOperationNo(String.format("%04d", newSeq));
            operationMapper.updateById(operation);
        }
    }

    // -----------------------------------------------------------------------
    //  Submit for Approval
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public void submitForApproval(Long routeId) {
        ProcessRoute route = getRouteOrThrow(routeId);

        if (route.getStatus() != 1) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "只有草稿状态的工艺路线才能提交审批");
        }

        Long currentUserId = SecurityUtils.getUserId();

        // Start workflow process
        Long businessObjectId = workflowService.startProcess(
                "PROCESS_APPROVAL",
                route.getId(),
                "PROCESS_ROUTE",
                route.getName(),
                route.getProjectId(),
                currentUserId
        );

        route.setStatus(2); // pending_approval
        route.setFlowInstanceId(String.valueOf(businessObjectId));
        routeMapper.updateById(route);
    }

    @Override
    @Transactional
    public void withdrawApproval(Long routeId) {
        ProcessRoute route = getRouteOrThrow(routeId);
        if (route.getStatus() != 2) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "只有审批中的工艺路线才能撤回");
        }
        if (route.getFlowInstanceId() != null) {
            try {
                Long boId = Long.parseLong(route.getFlowInstanceId());
                workflowService.withdrawApproval(boId, SecurityUtils.getUserId());
            } catch (NumberFormatException e) {
                // flowInstanceId may not be parseable
            }
        }
        route.setStatus(1); // back to draft
        route.setFlowInstanceId(null);
        routeMapper.updateById(route);
    }

    @Override
    @Transactional
    public void deleteRoute(Long routeId) {
        ProcessRoute route = getRouteOrThrow(routeId);
        if (route.getStatus() == 2) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "审批中的工艺路线不能删除");
        }
        if (route.getStatus() == 5) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "已发布的工艺路线不能删除");
        }
        routeMapper.deleteById(routeId);
    }

    @Override
    public List<RouteVersionVO> getVersions(Long routeId) {
        getRouteOrThrow(routeId);
        LambdaQueryWrapper<RouteVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(RouteVersion::getRouteId, routeId)
               .orderByDesc(RouteVersion::getCreatedAt);
        List<RouteVersion> versions = routeVersionMapper.selectList(wrapper);
        return versions.stream().map(this::toRouteVersionVO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RouteVersionVO createVersion(Long routeId, String description) {
        ProcessRoute route = getRouteOrThrow(routeId);

        // Determine next version number
        LambdaQueryWrapper<RouteVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(RouteVersion::getRouteId, routeId);
        Long count = routeVersionMapper.selectCount(wrapper);
        String nextVersion = String.valueOf((count != null ? count : 0) + 1) + ".0";

        // Snapshot current operations as JSON
        List<Operation> operations = operationMapper.selectByRouteId(routeId);
        String snapshotJson;
        try {
            snapshotJson = new com.fasterxml.jackson.databind.ObjectMapper()
                    .writeValueAsString(operations);
        } catch (Exception e) {
            snapshotJson = "[]";
        }

        RouteVersion version = new RouteVersion();
        version.setRouteId(routeId);
        version.setVersion(nextVersion);
        version.setDescription(description);
        version.setSnapshotJson(snapshotJson);
        version.setCreatedBy(SecurityUtils.getUserId());
        version.setCreatedAt(LocalDateTime.now());
        routeVersionMapper.insert(version);

        // Update route version field
        route.setVersion(nextVersion);
        routeMapper.updateById(route);

        return toRouteVersionVO(version);
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    private ProcessRoute getRouteOrThrow(Long id) {
        ProcessRoute route = routeMapper.selectById(id);
        if (route == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "工艺路线不存在");
        }
        return route;
    }

    private Operation getOperationOrThrow(Long id) {
        Operation operation = operationMapper.selectById(id);
        if (operation == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "工序不存在");
        }
        return operation;
    }

    /**
     * Ensure the route is editable. Published routes (status=5) are intercepted
     * as change requests via ChangeApprovalInterceptor.
     */
    private void ensureRouteEditable(Long routeId, String changeType, Object changeData) {
        ProcessRoute route = getRouteOrThrow(routeId);
        if (route.getStatus() != null && route.getStatus() >= 5) {
            if (route.getStatus() == 5 && changeInterceptor != null) {
                boolean intercepted = changeInterceptor.intercept(
                        "PROCESS_CHANGE", routeId, route.getStatus(), 5,
                        changeType, changeData, null,
                        route.getProjectId(), SecurityUtils.getUserId());
                if (intercepted) {
                    throw new BusinessException(ErrorCode.PARAM_ERROR,
                            "已发布工艺路线的修改已提交审批");
                }
            }
            throw new BusinessException(ErrorCode.PARAM_ERROR,
                    "已发布或已锁定的工艺路线不能直接修改");
        }
    }

    /**
     * Generate route number: PRC-YYYYMMDD-NNN.
     */
    private String generateRouteNo() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        LocalDate today = LocalDate.now();
        LambdaQueryWrapper<ProcessRoute> wrapper = new LambdaQueryWrapper<>();
        wrapper.ge(ProcessRoute::getCreatedAt, today.atStartOfDay())
               .lt(ProcessRoute::getCreatedAt, today.atTime(LocalTime.MAX));
        Long todayCount = routeMapper.selectCount(wrapper);

        int seq = (todayCount != null ? todayCount.intValue() : 0) + 1;
        String routeNo = String.format("PRC-%s-%03d", datePart, seq);

        for (int retry = 0; retry < 3; retry++) {
            LambdaQueryWrapper<ProcessRoute> checkWrapper = new LambdaQueryWrapper<>();
            checkWrapper.eq(ProcessRoute::getRouteNo, routeNo);
            if (routeMapper.selectCount(checkWrapper) == 0) {
                return routeNo;
            }
            seq++;
            routeNo = String.format("PRC-%s-%03d", datePart, seq);
        }
        return routeNo;
    }

    /**
     * Recalculate and persist the denormalised totals on a route.
     */
    private void recalculateRouteTotals(ProcessRoute route) {
        List<Operation> operations = operationMapper.selectByRouteId(route.getId());

        int totalOps = operations.size();
        BigDecimal totalHours = BigDecimal.ZERO;

        for (Operation op : operations) {
            LambdaQueryWrapper<ManHour> mhWrapper = new LambdaQueryWrapper<>();
            mhWrapper.eq(ManHour::getOperationId, op.getId());
            List<ManHour> manHours = manHourMapper.selectList(mhWrapper);
            for (ManHour mh : manHours) {
                if (mh.getHours() != null) {
                    totalHours = totalHours.add(mh.getHours());
                }
            }
        }

        route.setTotalOperations(totalOps);
        route.setTotalManHours(totalHours);
        routeMapper.updateById(route);
    }

    /**
     * Convert entity to list view VO.
     */
    private ProcessRouteVO toRouteVO(ProcessRoute route) {
        ProcessRouteVO vo = new ProcessRouteVO();
        vo.setId(route.getId());
        vo.setRouteNo(route.getRouteNo());
        vo.setName(route.getName());
        vo.setVersion(route.getVersion());
        vo.setBomId(route.getBomId());
        vo.setProjectId(route.getProjectId());
        vo.setOrderProductId(route.getOrderProductId());
        vo.setProductCode(route.getProductCode());
        vo.setProductName(route.getProductName());
        vo.setStatus(route.getStatus());
        vo.setIsLatest(route.getIsLatest());
        vo.setTotalOperations(route.getTotalOperations());
        vo.setTotalManHours(route.getTotalManHours());
        vo.setTotalMaterialCost(route.getTotalMaterialCost());
        vo.setCreatedBy(route.getCreatedBy());
        vo.setCreatedAt(route.getCreatedAt());
        vo.setUpdatedAt(route.getUpdatedAt());
        return vo;
    }

    /**
     * Convert entity to detail view VO (without operations).
     */
    private ProcessRouteDetailVO toRouteDetailVO(ProcessRoute route) {
        ProcessRouteDetailVO vo = new ProcessRouteDetailVO();
        vo.setId(route.getId());
        vo.setRouteNo(route.getRouteNo());
        vo.setName(route.getName());
        vo.setVersion(route.getVersion());
        vo.setBomId(route.getBomId());
        vo.setProjectId(route.getProjectId());
        vo.setOrderProductId(route.getOrderProductId());
        vo.setProductCode(route.getProductCode());
        vo.setProductName(route.getProductName());
        vo.setStatus(route.getStatus());
        vo.setIsLatest(route.getIsLatest());
        vo.setTotalOperations(route.getTotalOperations());
        vo.setTotalManHours(route.getTotalManHours());
        vo.setTotalMaterialCost(route.getTotalMaterialCost());
        vo.setCreatedBy(route.getCreatedBy());
        vo.setCreatedAt(route.getCreatedAt());
        vo.setUpdatedAt(route.getUpdatedAt());
        return vo;
    }

    /**
     * Convert entity to operation VO.
     */
    private OperationVO toOperationVO(Operation op) {
        OperationVO vo = new OperationVO();
        vo.setId(op.getId());
        vo.setRouteId(op.getRouteId());
        vo.setSeqNo(op.getSeqNo());
        vo.setOperationNo(op.getOperationNo());
        vo.setName(op.getName());
        vo.setDescription(op.getDescription());
        vo.setMaterialCode(op.getMaterialCode());
        vo.setMaterialName(op.getMaterialName());
        vo.setDrawingNo(op.getDrawingNo());
        vo.setSourceType(op.getSourceType());
        vo.setIsVirtual(op.getIsVirtual());
        vo.setWorkCenterId(op.getWorkCenterId());
        vo.setWorkCenterCode(op.getWorkCenterCode());
        vo.setWorkCenterName(op.getWorkCenterName());
        vo.setStatus(op.getStatus());
        vo.setCreatedAt(op.getCreatedAt());
        vo.setUpdatedAt(op.getUpdatedAt());
        return vo;
    }

    private RouteVersionVO toRouteVersionVO(RouteVersion v) {
        RouteVersionVO vo = new RouteVersionVO();
        vo.setId(v.getId());
        vo.setRouteId(v.getRouteId());
        vo.setVersion(v.getVersion());
        vo.setDescription(v.getDescription());
        vo.setStatus("saved");
        vo.setCreatedAt(v.getCreatedAt());
        return vo;
    }
}
