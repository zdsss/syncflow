package com.syncflow.workflow.service;

import com.syncflow.workflow.entity.Delegation;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for managing approval delegations.
 */
public interface DelegationService {

    /**
     * Create a delegation from one user to another for a specific business object.
     *
     * @param businessObjectId the business object the delegation applies to
     * @param fromUserId       the original approver delegating their authority
     * @param toUserId         the user receiving delegated authority
     * @param reason           reason for delegation
     * @param startTime        delegation start time
     * @param endTime          delegation end time (null means indefinite)
     */
    void delegate(Long businessObjectId, Long fromUserId, Long toUserId,
                  String reason, LocalDateTime startTime, LocalDateTime endTime);

    /**
     * Revoke (deactivate) a delegation.
     *
     * @param delegationId the delegation to revoke
     * @param userId       the user requesting the revocation (must match fromUserId)
     */
    void revoke(Long delegationId, Long userId);

    /**
     * Get all active delegations for a given user (as the delegator).
     *
     * @param userId the delegator's user id
     * @return list of active delegations
     */
    List<Delegation> getActiveDelegations(Long userId);

    /**
     * Resolve the effective approver for a given original approver.
     * If there is an active delegation for this user, returns the delegated user;
     * otherwise returns the original approver.
     *
     * @param originalApproverId the original approver's user id
     * @return the effective approver's user id
     */
    default Long resolveDelegatedApprover(Long originalApproverId) {
        return resolveDelegatedApprover(originalApproverId, null);
    }

    /**
     * Resolve the effective approver for a given original approver, scoped to a business object.
     * Checks specific delegation first, then falls back to global delegation.
     *
     * @param originalApproverId the original approver's user id
     * @param businessObjectId   the business object id (nullable for global lookup)
     * @return the effective approver's user id
     */
    Long resolveDelegatedApprover(Long originalApproverId, Long businessObjectId);
}
