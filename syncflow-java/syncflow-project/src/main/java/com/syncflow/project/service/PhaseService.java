package com.syncflow.project.service;

import com.syncflow.project.dto.PhaseTreeVO;

import java.util.List;
import java.util.Map;

/**
 * Service interface for phase lifecycle management within a project.
 */
public interface PhaseService {

    /**
     * Create a new phase for a project.
     *
     * @param projectId the project id
     * @param name      phase name
     * @param code      phase code
     * @return the created phase as a PhaseTreeVO
     */
    PhaseTreeVO createPhase(Long projectId, String name, String code);

    /**
     * Update an existing phase.
     *
     * @param id        phase id
     * @param name      new name (null to skip)
     * @param code      new code (null to skip)
     * @return the updated phase as a PhaseTreeVO
     */
    PhaseTreeVO updatePhase(Long id, String name, String code);

    /**
     * Delete a phase. Fails if the phase has milestones.
     *
     * @param id phase id
     */
    void deletePhase(Long id);

    /**
     * Reorder phases within a project.
     *
     * @param projectId      the project id
     * @param phaseIdSeqNos  map of phaseId -> new seqNo
     */
    void reorderPhases(Long projectId, Map<Long, Integer> phaseIdSeqNos);
}
