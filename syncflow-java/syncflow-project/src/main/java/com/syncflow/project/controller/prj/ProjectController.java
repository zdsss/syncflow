package com.syncflow.project.controller.prj;

import com.syncflow.common.result.Result;
import com.syncflow.common.vo.TreeNodeVO;
import com.syncflow.project.dto.*;
import com.syncflow.project.service.MilestoneService;
import com.syncflow.project.service.PhaseService;
import com.syncflow.project.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for project management operations.
 * Handles project CRUD, phase trees, milestones, and Gantt chart data.
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final PhaseService phaseService;
    private final MilestoneService milestoneService;

    public ProjectController(ProjectService projectService,
                             PhaseService phaseService,
                             MilestoneService milestoneService) {
        this.projectService = projectService;
        this.phaseService = phaseService;
        this.milestoneService = milestoneService;
    }

    // -----------------------------------------------------------------------
    //  Project CRUD
    // -----------------------------------------------------------------------

    /**
     * Get the hierarchical project tree.
     */
    @GetMapping
    public Result<List<ProjectVO>> getProjectTree() {
        List<ProjectVO> tree = projectService.getProjectTree();
        return Result.success(tree);
    }

    /**
     * Get the navigation tree (projects/stages) for the frontend sidebar.
     */
    @GetMapping("/tree")
    public Result<List<TreeNodeVO>> getNavigationTree() {
        List<TreeNodeVO> tree = projectService.getNavigationTree();
        return Result.success(tree);
    }

    /**
     * Get project detail by ID.
     */
    @GetMapping("/{id}")
    public Result<ProjectVO> getProjectDetail(@PathVariable Long id) {
        ProjectVO vo = projectService.getProjectDetail(id);
        return Result.success(vo);
    }

    /**
     * Create a new project.
     */
    @PostMapping
    public Result<ProjectVO> createProject(@Valid @RequestBody CreateProjectDTO dto) {
        ProjectVO vo = projectService.createProject(dto);
        return Result.success(vo);
    }

    /**
     * Update an existing project.
     */
    @PutMapping("/{id}")
    public Result<ProjectVO> updateProject(@PathVariable Long id,
                                           @Valid @RequestBody CreateProjectDTO dto) {
        ProjectVO vo = projectService.updateProject(id, dto);
        return Result.success(vo);
    }

    /**
     * Delete a project (soft delete).
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return Result.success();
    }

    /**
     * Update project status only (e.g. not_started → in_progress → completed).
     */
    @PutMapping("/{id}/status")
    public Result<Void> updateProjectStatus(@PathVariable Long id,
                                            @RequestBody Map<String, Integer> body) {
        projectService.updateProjectStatus(id, body.get("status"));
        return Result.success();
    }

    // -----------------------------------------------------------------------
    //  Phase tree and milestones
    // -----------------------------------------------------------------------

    /**
     * Get the phase tree (phases with milestones and stage gates) for a project.
     */
    @GetMapping("/{id}/phases/tree")
    public Result<List<PhaseTreeVO>> getPhaseTree(@PathVariable Long id) {
        List<PhaseTreeVO> tree = projectService.getPhaseTree(id);
        return Result.success(tree);
    }

    /**
     * Get milestones for a project, optionally filtered by phase.
     */
    @GetMapping("/{id}/milestones")
    public Result<List<MilestoneVO>> getMilestones(
            @PathVariable Long id,
            @RequestParam(required = false) Long phaseId) {
        List<MilestoneVO> milestones = projectService.getMilestones(id, phaseId);
        return Result.success(milestones);
    }

    /**
     * Complete a milestone (may trigger approval workflow if deliverable is set).
     */
    @PostMapping("/milestones/{milestoneId}/complete")
    public Result<Void> completeMilestone(@PathVariable Long milestoneId) {
        milestoneService.completeMilestone(milestoneId);
        return Result.success();
    }

    /**
     * Start a milestone (transition from not_started to in_progress).
     */
    @PutMapping("/milestones/{milestoneId}/start")
    public Result<MilestoneVO> startMilestone(@PathVariable Long milestoneId) {
        MilestoneVO vo = milestoneService.startMilestone(milestoneId);
        return Result.success(vo);
    }

    /**
     * Create a milestone for a project.
     */
    @PostMapping("/{id}/milestones")
    public Result<MilestoneVO> createMilestone(@PathVariable Long id,
                                               @Valid @RequestBody CreateMilestoneDTO dto) {
        MilestoneVO vo = milestoneService.createMilestone(id, dto);
        return Result.success(vo);
    }

    /**
     * Update a milestone.
     */
    @PutMapping("/milestones/{milestoneId}")
    public Result<MilestoneVO> updateMilestone(@PathVariable Long milestoneId,
                                               @Valid @RequestBody CreateMilestoneDTO dto) {
        MilestoneVO vo = milestoneService.updateMilestone(milestoneId, dto);
        return Result.success(vo);
    }

    /**
     * Get Gantt chart data for a project.
     */
    @GetMapping("/{id}/gantt")
    public Result<GanttChartVO> getGanttData(@PathVariable Long id) {
        GanttChartVO gantt = projectService.getGanttData(id);
        return Result.success(gantt);
    }

    // -----------------------------------------------------------------------
    //  Project member management
    // -----------------------------------------------------------------------

    /**
     * Get all members of a project.
     */
    @GetMapping("/{id}/members")
    public Result<List<ProjectMemberVO>> getMembers(@PathVariable Long id) {
        List<ProjectMemberVO> members = projectService.getMembers(id);
        return Result.success(members);
    }

    /**
     * Add a member to a project.
     * Request body: { "userId": 1, "projectRole": "ENGINEER", "deptId": 2 }
     */
    @SuppressWarnings("unchecked")
    @PostMapping("/{id}/members")
    public Result<Void> addMember(@PathVariable Long id,
                                  @RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        String projectRole = (String) body.get("projectRole");
        Long deptId = body.get("deptId") != null
                ? Long.valueOf(body.get("deptId").toString())
                : null;
        projectService.addMember(id, userId, projectRole, deptId);
        return Result.success();
    }

    /**
     * Remove a member from a project.
     */
    @DeleteMapping("/{id}/members/{userId}")
    public Result<Void> removeMember(@PathVariable Long id,
                                     @PathVariable Long userId) {
        projectService.removeMember(id, userId);
        return Result.success();
    }

    // -----------------------------------------------------------------------
    //  Phase CRUD
    // -----------------------------------------------------------------------

    /**
     * Create a new phase within a project.
     */
    @PostMapping("/{id}/phases")
    public Result<PhaseTreeVO> createPhase(@PathVariable Long id,
                                           @RequestBody Map<String, String> body) {
        String name = body.get("name");
        String code = body.get("code");
        PhaseTreeVO vo = phaseService.createPhase(id, name, code);
        return Result.success(vo);
    }

    /**
     * Update an existing phase.
     */
    @PutMapping("/phases/{phaseId}")
    public Result<PhaseTreeVO> updatePhase(@PathVariable Long phaseId,
                                           @RequestBody Map<String, String> body) {
        String name = body.get("name");
        String code = body.get("code");
        PhaseTreeVO vo = phaseService.updatePhase(phaseId, name, code);
        return Result.success(vo);
    }

    /**
     * Delete a phase.
     */
    @DeleteMapping("/phases/{phaseId}")
    public Result<Void> deletePhase(@PathVariable Long phaseId) {
        phaseService.deletePhase(phaseId);
        return Result.success();
    }

    /**
     * Reorder phases within a project.
     * Request body: { "phaseId1": seqNo1, "phaseId2": seqNo2, ... }
     */
    @PutMapping("/{id}/phases/reorder")
    public Result<Void> reorderPhases(@PathVariable Long id,
                                      @RequestBody Map<String, Integer> phaseIdSeqNos) {
        // Convert String keys (from JSON) to Long keys expected by the service
        Map<Long, Integer> converted = phaseIdSeqNos.entrySet().stream()
                .collect(java.util.stream.Collectors.toMap(
                        e -> Long.parseLong(e.getKey()),
                        Map.Entry::getValue));
        phaseService.reorderPhases(id, converted);
        return Result.success();
    }
}
