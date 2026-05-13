package com.syncflow.workflow.service;

import com.syncflow.workflow.entity.ChangeRequest;

import java.util.List;

/**
 * Service for managing change requests (BOM / process-route / module-spec changes).
 */
public interface ChangeRequestService {

    /**
     * Create a new change request.
     *
     * @return the id of the newly created request
     */
    Long createRequest(String objectType, Long objectId, String changeType,
                       String changeData, String changeSummary, Long requestedBy);

    /**
     * Get a change request by id.
     */
    ChangeRequest getRequest(Long id);

    /**
     * Get all change requests for a given entity.
     */
    List<ChangeRequest> getRequestsByObject(String objectType, Long objectId);

    /**
     * Mark a change request as applied.
     */
    void applyRequest(Long requestId, Long resolvedBy);

    /**
     * Mark a change request as rejected.
     */
    void rejectRequest(Long requestId, Long resolvedBy);
}
