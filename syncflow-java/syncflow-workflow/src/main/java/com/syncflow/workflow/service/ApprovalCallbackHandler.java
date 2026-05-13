package com.syncflow.workflow.service;

/**
 * Callback interface for handling approval lifecycle events on business entities.
 * <p>
 * Implementations are registered per object-type in {@link ApprovalCallbackRegistry}.
 */
public interface ApprovalCallbackHandler {

    /**
     * @return the object type(s) this handler supports (e.g. "BOM", "MILESTONE")
     */
    java.util.Set<String> supportedObjectTypes();

    /**
     * Called when an approval process completes successfully.
     *
     * @param objectId   the business entity primary key
     * @param approverId the user who performed the final approval
     */
    void onApproved(Long objectId, Long approverId);

    /**
     * Called when an approval process is rejected.
     *
     * @param objectId the business entity primary key
     * @param reason   rejection reason (may be null)
     */
    void onRejected(Long objectId, String reason);

    /**
     * Called when an approval process is withdrawn by the applicant.
     *
     * @param objectId the business entity primary key
     */
    void onWithdrawn(Long objectId);
}
