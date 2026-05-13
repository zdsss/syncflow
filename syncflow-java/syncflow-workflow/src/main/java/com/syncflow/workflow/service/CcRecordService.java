package com.syncflow.workflow.service;

import com.syncflow.workflow.entity.CcRecord;

import java.util.List;

/**
 * Service for managing CC (carbon-copy) records on approvals.
 */
public interface CcRecordService {

    /**
     * Add a CC record for a user on a business object.
     *
     * @param businessObjectId the business object to CC
     * @param userId           the user to CC
     */
    void addCc(Long businessObjectId, Long userId);

    /**
     * Mark a CC record as read.
     *
     * @param ccRecordId the CC record id
     * @param userId     the user marking it as read (must match the CC recipient)
     */
    void markAsRead(Long ccRecordId, Long userId);

    /**
     * Get CC records for a user, optionally filtering to unread only.
     *
     * @param userId    the user's id
     * @param unreadOnly if true, return only unread records
     * @return list of CC records
     */
    List<CcRecord> getCcRecords(Long userId, boolean unreadOnly);
}
