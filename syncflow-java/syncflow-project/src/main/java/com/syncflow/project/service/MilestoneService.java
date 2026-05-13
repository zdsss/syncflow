package com.syncflow.project.service;

import com.syncflow.project.dto.CreateMilestoneDTO;
import com.syncflow.project.dto.MilestoneVO;

/**
 * Service for milestone CRUD and completion workflow.
 */
public interface MilestoneService {

    /**
     * Create a new milestone for a project.
     *
     * @param projectId the project id
     * @param dto       creation payload
     * @return the created milestone as a view object
     */
    MilestoneVO createMilestone(Long projectId, CreateMilestoneDTO dto);

    /**
     * Update an existing milestone.
     *
     * @param milestoneId the milestone id
     * @param dto         update payload
     * @return the updated milestone as a view object
     */
    MilestoneVO updateMilestone(Long milestoneId, CreateMilestoneDTO dto);

    /**
     * Start a milestone (transition from not_started to in_progress).
     *
     * @param milestoneId the milestone id
     * @return the updated milestone as a view object
     */
    MilestoneVO startMilestone(Long milestoneId);

    /**
     * Complete a milestone. If the milestone has deliverables, triggers an
     * approval workflow; otherwise marks it completed directly.
     *
     * @param milestoneId the milestone id
     */
    void completeMilestone(Long milestoneId);
}
