package com.syncflow.project.service;

import com.syncflow.project.dto.*;

import java.util.List;

/**
 * Service interface for project management operations.
 */
public interface ProjectService {

    /**
     * Build a hierarchical project tree from the flat list of all projects.
     *
     * @return root-level projects with nested children
     */
    List<ProjectVO> getProjectTree();

    /**
     * Get full detail for a single project.
     *
     * @param id project id
     * @return project view object
     */
    ProjectVO getProjectDetail(Long id);

    /**
     * Create a new project.
     *
     * @param dto creation payload
     * @return the created project as a view object
     */
    ProjectVO createProject(CreateProjectDTO dto);

    /**
     * Update an existing project.
     *
     * @param id  project id
     * @param dto update payload
     * @return the updated project as a view object
     */
    ProjectVO updateProject(Long id, CreateProjectDTO dto);

    /**
     * Soft-delete a project. Fails if the project has child projects.
     *
     * @param id project id
     */
    void deleteProject(Long id);

    /**
     * Get the phase tree for a project, with milestones and stage gates assembled.
     *
     * @param projectId the project id
     * @return ordered list of phases, each containing its milestones and gates
     */
    List<PhaseTreeVO> getPhaseTree(Long projectId);

    /**
     * Get milestones for a project, optionally filtered by phase.
     *
     * @param projectId the project id (required)
     * @param phaseId   the phase id (optional, may be null)
     * @return list of milestones
     */
    List<MilestoneVO> getMilestones(Long projectId, Long phaseId);

    /**
     * Get Gantt chart data (phases + milestones) for a project.
     *
     * @param projectId the project id
     * @return Gantt chart view object
     */
    GanttChartVO getGanttData(Long projectId);

    // -----------------------------------------------------------------------
    //  Project member management
    // -----------------------------------------------------------------------

    /**
     * Get all members of a project.
     *
     * @param projectId the project id
     * @return list of project members with resolved user and department names
     */
    List<ProjectMemberVO> getMembers(Long projectId);

    /**
     * Add a member to a project.
     *
     * @param projectId   the project id
     * @param userId      the user id to add
     * @param projectRole the role within the project
     * @param deptId      the department id at join time
     */
    void addMember(Long projectId, Long userId, String projectRole, Long deptId);

    /**
     * Remove a member from a project.
     *
     * @param projectId the project id
     * @param userId    the user id to remove
     */
    void removeMember(Long projectId, Long userId);

    /**
     * Update the status of a project.
     *
     * @param id     project id
     * @param status new status value
     */
    void updateProjectStatus(Long id, Integer status);
}
