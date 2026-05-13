package com.syncflow.process.service;

import com.syncflow.process.dto.*;

import java.util.List;

/**
 * Process route management service interface.
 */
public interface ProcessRouteService {

    List<ProcessRouteVO> getRouteList(Long bomId, Long projectId);

    ProcessRouteDetailVO getRouteDetail(Long id);

    ProcessRouteVO createRoute(CreateProcessRouteDTO dto);

    OperationVO addOperation(Long routeId, CreateOperationDTO dto);

    OperationVO updateOperation(Long operationId, CreateOperationDTO dto);

    void deleteOperation(Long operationId);

    void reorderOperations(Long routeId, List<Long> operationIds);

    void submitForApproval(Long routeId);

    void withdrawApproval(Long routeId);

    void deleteRoute(Long routeId);

    List<RouteVersionVO> getVersions(Long routeId);

    RouteVersionVO createVersion(Long routeId, String description);
}
