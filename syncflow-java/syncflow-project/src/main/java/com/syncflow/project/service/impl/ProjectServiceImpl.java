package com.syncflow.project.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.common.vo.TreeNodeVO;
import com.syncflow.project.dto.*;
import com.syncflow.project.entity.Milestone;
import com.syncflow.project.entity.Project;
import com.syncflow.project.entity.ProjectMember;
import com.syncflow.project.entity.StageGate;
import com.syncflow.project.mapper.*;
import com.syncflow.project.service.ProjectService;
import com.syncflow.workflow.entity.BusinessObject;
import com.syncflow.workflow.service.WorkflowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of {@link ProjectService}.
 */
@Service
public class ProjectServiceImpl implements ProjectService {

    private static final Logger log = LoggerFactory.getLogger(ProjectServiceImpl.class);

    private final ProjectMapper projectMapper;
    private final PhaseMapper phaseMapper;
    private final MilestoneMapper milestoneMapper;
    private final StageGateMapper stageGateMapper;
    private final SysUserMapper sysUserMapper;
    private final ProjectMemberMapper projectMemberMapper;
    private final SysDepartmentMapper sysDepartmentMapper;
    private final TaskGanttMapper taskGanttMapper;

    @Lazy
    private WorkflowService workflowService;

    @Autowired
    public void setWorkflowService(@Lazy WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    public ProjectServiceImpl(ProjectMapper projectMapper,
                              PhaseMapper phaseMapper,
                              MilestoneMapper milestoneMapper,
                              StageGateMapper stageGateMapper,
                              SysUserMapper sysUserMapper,
                              ProjectMemberMapper projectMemberMapper,
                              SysDepartmentMapper sysDepartmentMapper,
                              TaskGanttMapper taskGanttMapper) {
        this.projectMapper = projectMapper;
        this.phaseMapper = phaseMapper;
        this.milestoneMapper = milestoneMapper;
        this.stageGateMapper = stageGateMapper;
        this.sysUserMapper = sysUserMapper;
        this.projectMemberMapper = projectMemberMapper;
        this.sysDepartmentMapper = sysDepartmentMapper;
        this.taskGanttMapper = taskGanttMapper;
    }

    // -----------------------------------------------------------------------
    //  Project CRUD
    // -----------------------------------------------------------------------

    @Override
    public List<ProjectVO> getProjectTree() {
        List<Project> allProjects = projectMapper.selectProjectTree();
        if (allProjects.isEmpty()) {
            return List.of();
        }

        // Convert all to VOs
        Map<Long, ProjectVO> voMap = new LinkedHashMap<>();
        for (Project p : allProjects) {
            voMap.put(p.getId(), toProjectVO(p));
        }

        // Build parent -> children adjacency
        List<ProjectVO> roots = new ArrayList<>();
        for (Project p : allProjects) {
            ProjectVO vo = voMap.get(p.getId());
            if (p.getParentId() != null && voMap.containsKey(p.getParentId())) {
                ProjectVO parent = voMap.get(p.getParentId());
                if (parent.getChildren() == null) {
                    parent.setChildren(new ArrayList<>());
                }
                parent.getChildren().add(vo);
            } else {
                // root-level project (no parent or parent not found)
                roots.add(vo);
            }
        }

        return roots;
    }

    @Override
    public ProjectVO getProjectDetail(Long id) {
        Project project = projectMapper.selectById(id);
        if (project == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }
        return toProjectVO(project);
    }

    @Override
    @Transactional
    public ProjectVO createProject(CreateProjectDTO dto) {
        // Validate code uniqueness
        LambdaQueryWrapper<Project> codeWrapper = new LambdaQueryWrapper<>();
        codeWrapper.eq(Project::getCode, dto.getCode());
        Long existingCount = projectMapper.selectCount(codeWrapper);
        if (existingCount > 0) {
            throw new BusinessException(ErrorCode.PROJECT_CODE_EXISTS,
                    "Project code '" + dto.getCode() + "' already exists");
        }

        Project project = new Project();
        project.setName(dto.getName());
        project.setCode(dto.getCode());
        project.setDescription(dto.getDescription());
        project.setOwnerId(dto.getOwnerId());
        project.setProjectType(dto.getProjectType());
        project.setParentId(dto.getParentId());
        project.setPlannedStart(dto.getPlannedStart());
        project.setPlannedEnd(dto.getPlannedEnd());
        project.setStatus(1); // not_started
        project.setProgress(0);

        // Build parent path
        if (dto.getParentId() != null && dto.getParentId() != 0) {
            Project parent = projectMapper.selectById(dto.getParentId());
            if (parent == null) {
                throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND,
                        "Parent project not found");
            }
            String parentPath = parent.getParentPath() != null
                    ? parent.getParentPath() + "," + parent.getId()
                    : String.valueOf(parent.getId());
            project.setParentPath(parentPath);
        }

        projectMapper.insert(project);

        // Auto-create 6 industrial standard phases
        String[][] PHASES = {
                {"INVESTIGATION", "调查", "1"},
                {"CONCEPT", "概念", "2"},
                {"PLANNING", "计划", "3"},
                {"DEVELOPMENT", "开发", "4"},
                {"TESTING", "测试", "5"},
                {"MASS_PRODUCTION", "量产", "6"}
        };

        for (String[] phase : PHASES) {
            com.syncflow.project.entity.ProjectPhase p = new com.syncflow.project.entity.ProjectPhase();
            p.setProjectId(project.getId());
            p.setCode(phase[0]);
            p.setName(phase[1]);
            p.setSeqNo(Integer.parseInt(phase[2]));
            p.setStatus(1); // not started
            p.setProgress(0);
            // If project has planned dates, distribute phases evenly
            if (dto.getPlannedStart() != null && dto.getPlannedEnd() != null) {
                long totalDays = java.time.temporal.ChronoUnit.DAYS.between(
                        dto.getPlannedStart(), dto.getPlannedEnd());
                long daysPerPhase = totalDays / 6;
                int seqNo = Integer.parseInt(phase[2]);
                p.setPlannedStart(dto.getPlannedStart().plusDays(daysPerPhase * (seqNo - 1)));
                p.setPlannedEnd(dto.getPlannedStart().plusDays(daysPerPhase * seqNo));
            }
            phaseMapper.insert(p);
        }

        // Start project creation approval workflow only if configured
        if (workflowService != null && workflowService.isApprovalRequired("PROJECT")) {
            try {
                Long currentUserId = SecurityUtils.getUserId();
                Long businessObjectId = workflowService.startProcess(
                        "GENERIC_APPROVAL",
                        project.getId(),
                        "PROJECT",
                        project.getName(),
                        project.getId(),
                        currentUserId
                );

                BusinessObject bo = workflowService.getBusinessObjectEntity(businessObjectId);
                if (bo != null && bo.getFlowInstanceId() != null) {
                    project.setFlowInstanceId(bo.getFlowInstanceId());
                    projectMapper.updateById(project);
                }
            } catch (Exception e) {
                log.warn("Failed to start approval workflow for project {}: {}", project.getId(), e.getMessage());
            }
        }

        return toProjectVO(project);
    }

    @Override
    public ProjectVO updateProject(Long id, CreateProjectDTO dto) {
        Project project = projectMapper.selectById(id);
        if (project == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }

        // If code changed, validate uniqueness
        if (!project.getCode().equals(dto.getCode())) {
            LambdaQueryWrapper<Project> codeWrapper = new LambdaQueryWrapper<>();
            codeWrapper.eq(Project::getCode, dto.getCode());
            Long count = projectMapper.selectCount(codeWrapper);
            if (count > 0) {
                throw new BusinessException(ErrorCode.PROJECT_CODE_EXISTS,
                        "Project code '" + dto.getCode() + "' already exists");
            }
        }

        project.setName(dto.getName());
        project.setCode(dto.getCode());
        project.setDescription(dto.getDescription());
        project.setOwnerId(dto.getOwnerId());
        project.setProjectType(dto.getProjectType());
        project.setPlannedStart(dto.getPlannedStart());
        project.setPlannedEnd(dto.getPlannedEnd());

        projectMapper.updateById(project);
        return toProjectVO(project);
    }

    @Override
    public void deleteProject(Long id) {
        Project project = projectMapper.selectById(id);
        if (project == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }

        // Check no children exist
        LambdaQueryWrapper<Project> childWrapper = new LambdaQueryWrapper<>();
        childWrapper.eq(Project::getParentId, id);
        Long childCount = projectMapper.selectCount(childWrapper);
        if (childCount > 0) {
            throw new BusinessException(ErrorCode.PROJECT_HAS_CHILDREN);
        }

        // Check no active tasks (status not COMPLETED or CANCELLED)
        long activeTasks = taskGanttMapper.countActiveTasksByProject(id);
        if (activeTasks > 0) {
            throw new BusinessException(ErrorCode.PROJECT_HAS_ACTIVE_TASKS);
        }

        // Check no pending approvals
        long pendingApprovals = taskGanttMapper.countPendingApprovalsByProject(id);
        if (pendingApprovals > 0) {
            throw new BusinessException(ErrorCode.PROJECT_HAS_PENDING_APPROVALS);
        }

        // Soft delete (MyBatis-Plus @TableLogic handles this)
        projectMapper.deleteById(id);
    }

    // -----------------------------------------------------------------------
    //  Phase tree
    // -----------------------------------------------------------------------

    @Override
    public List<PhaseTreeVO> getPhaseTree(Long projectId) {
        // Verify project exists
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }

        List<com.syncflow.project.entity.ProjectPhase> phases =
                phaseMapper.selectByProjectId(projectId);
        if (phases.isEmpty()) {
            return List.of();
        }

        // Collect all phase ids
        List<Long> phaseIds = phases.stream()
                .map(com.syncflow.project.entity.ProjectPhase::getId)
                .collect(Collectors.toList());

        // Fetch all milestones for these phases
        LambdaQueryWrapper<Milestone> msWrapper = new LambdaQueryWrapper<>();
        msWrapper.in(Milestone::getPhaseId, phaseIds);
        List<Milestone> allMilestones = milestoneMapper.selectList(msWrapper);

        Map<Long, List<MilestoneVO>> milestonesByPhase = allMilestones.stream()
                .collect(Collectors.groupingBy(
                        Milestone::getPhaseId,
                        Collectors.mapping(this::toMilestoneVO, Collectors.toList())
                ));

        // Fetch all stage gates for these phases
        LambdaQueryWrapper<StageGate> sgWrapper = new LambdaQueryWrapper<>();
        sgWrapper.in(StageGate::getPhaseId, phaseIds);
        List<StageGate> allGates = stageGateMapper.selectList(sgWrapper);

        Map<Long, List<StageGateVO>> gatesByPhase = allGates.stream()
                .collect(Collectors.groupingBy(
                        StageGate::getPhaseId,
                        Collectors.mapping(this::toStageGateVO, Collectors.toList())
                ));

        // Assemble PhaseTreeVO list
        List<PhaseTreeVO> result = new ArrayList<>();
        for (com.syncflow.project.entity.ProjectPhase phase : phases) {
            PhaseTreeVO vo = toPhaseTreeVO(phase);
            vo.setMilestones(milestonesByPhase.getOrDefault(phase.getId(), List.of()));
            vo.setStageGates(gatesByPhase.getOrDefault(phase.getId(), List.of()));
            result.add(vo);
        }

        return result;
    }

    // -----------------------------------------------------------------------
    //  Milestones
    // -----------------------------------------------------------------------

    @Override
    public List<MilestoneVO> getMilestones(Long projectId, Long phaseId) {
        // Verify project exists
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }

        List<Milestone> milestones = milestoneMapper.selectByProjectAndPhase(projectId, phaseId);
        return milestones.stream()
                .map(this::toMilestoneVO)
                .collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    //  Gantt chart
    // -----------------------------------------------------------------------

    @Override
    public GanttChartVO getGanttData(Long projectId) {
        // Verify project exists
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }

        List<GanttChartVO.GanttTaskVO> tasks = new ArrayList<>();

        LocalDate globalStart = null;
        LocalDate globalEnd = null;

        // Fetch phases
        List<com.syncflow.project.entity.ProjectPhase> phases =
                phaseMapper.selectByProjectId(projectId);
        for (com.syncflow.project.entity.ProjectPhase phase : phases) {
            GanttChartVO.GanttTaskVO task = new GanttChartVO.GanttTaskVO();
            task.setId(phase.getId());
            task.setName(phase.getName());
            task.setType("PHASE");
            task.setPlannedStart(phase.getPlannedStart());
            task.setPlannedEnd(phase.getPlannedEnd());
            task.setProgress(phase.getProgress());
            task.setParentId(projectId);
            task.setStatus(phase.getStatus());
            tasks.add(task);

            if (phase.getPlannedStart() != null) {
                globalStart = earliest(globalStart, phase.getPlannedStart());
            }
            if (phase.getPlannedEnd() != null) {
                globalEnd = latest(globalEnd, phase.getPlannedEnd());
            }
        }

        // Fetch milestones
        List<Milestone> milestones = milestoneMapper.selectByProjectAndPhase(projectId, null);
        for (Milestone ms : milestones) {
            GanttChartVO.GanttTaskVO task = new GanttChartVO.GanttTaskVO();
            task.setId(ms.getId());
            task.setName(ms.getName());
            task.setType("MILESTONE");
            task.setPlannedDate(ms.getPlannedDate());
            task.setProgress(ms.getProgress());
            task.setParentId(ms.getPhaseId() != null ? ms.getPhaseId() : projectId);
            task.setStatus(ms.getStatus());
            tasks.add(task);

            if (ms.getPlannedDate() != null) {
                globalStart = earliest(globalStart, ms.getPlannedDate());
                globalEnd = latest(globalEnd, ms.getPlannedDate());
            }
        }

        // Fetch tasks for this project
        List<Map<String, Object>> taskRows = taskGanttMapper.selectTasksForGantt(projectId);
        for (Map<String, Object> row : taskRows) {
            GanttChartVO.GanttTaskVO task = new GanttChartVO.GanttTaskVO();
            task.setId(toLong(row.get("id")));
            task.setName((String) row.get("title"));
            task.setType("TASK");
            task.setStatus(toInt(row.get("status")));
            task.setProgress(toInt(row.get("progress")));
            task.setPlannedStart(toLocalDate(row.get("planned_start")));
            task.setPlannedEnd(toLocalDate(row.get("planned_end")));
            task.setAssigneeId(toLong(row.get("assignee_id")));
            task.setAssigneeName((String) row.get("assignee_name"));
            task.setPhaseId(toLong(row.get("phase_id")));
            task.setMilestoneId(toLong(row.get("milestone_id")));
            // Parent is the phase if assigned, otherwise the project
            Long phaseId = toLong(row.get("phase_id"));
            task.setParentId(phaseId != null ? phaseId : projectId);
            tasks.add(task);

            LocalDate taskStart = toLocalDate(row.get("planned_start"));
            LocalDate taskEnd = toLocalDate(row.get("planned_end"));
            if (taskStart != null) {
                globalStart = earliest(globalStart, taskStart);
            }
            if (taskEnd != null) {
                globalEnd = latest(globalEnd, taskEnd);
            }
        }

        GanttChartVO gantt = new GanttChartVO();
        gantt.setStartDate(globalStart);
        gantt.setEndDate(globalEnd);
        gantt.setTasks(tasks);

        // Fetch task dependencies for dependency lines in Gantt chart
        List<Map<String, Object>> depRows = taskGanttMapper.selectDependenciesForGantt(projectId);
        List<GanttChartVO.GanttDependencyVO> depVOs = new ArrayList<>();
        for (Map<String, Object> row : depRows) {
            GanttChartVO.GanttDependencyVO vo = new GanttChartVO.GanttDependencyVO();
            vo.setTaskId(toLong(row.get("task_id")));
            vo.setDependsOnTaskId(toLong(row.get("depends_on_task_id")));
            vo.setDependencyType((String) row.get("dependency_type"));
            depVOs.add(vo);
        }
        gantt.setDependencies(depVOs);

        return gantt;
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    private ProjectVO toProjectVO(Project p) {
        ProjectVO vo = new ProjectVO();
        vo.setId(p.getId());
        vo.setName(p.getName());
        vo.setCode(p.getCode());
        vo.setDescription(p.getDescription());
        vo.setOwnerId(p.getOwnerId());
        vo.setProjectType(p.getProjectType());
        vo.setStatus(p.getStatus());
        vo.setPriority(p.getPriority());
        vo.setProgress(p.getProgress());
        vo.setPlannedStart(p.getPlannedStart());
        vo.setPlannedEnd(p.getPlannedEnd());
        vo.setActualStart(p.getActualStart());
        vo.setActualEnd(p.getActualEnd());
        vo.setParentId(p.getParentId());
        vo.setParentPath(p.getParentPath());
        vo.setDeptId(p.getDeptId());
        vo.setFlowInstanceId(p.getFlowInstanceId());
        vo.setTenantId(p.getTenantId());
        vo.setCreatedAt(p.getCreatedAt());
        vo.setUpdatedAt(p.getUpdatedAt());

        // Resolve owner name
        if (p.getOwnerId() != null) {
            String ownerName = sysUserMapper.selectRealNameById(p.getOwnerId());
            vo.setOwnerName(ownerName);
        }

        return vo;
    }

    private MilestoneVO toMilestoneVO(Milestone m) {
        MilestoneVO vo = new MilestoneVO();
        vo.setId(m.getId());
        vo.setProjectId(m.getProjectId());
        vo.setPhaseId(m.getPhaseId());
        vo.setName(m.getName());
        vo.setType(m.getType());
        vo.setStatus(m.getStatus());
        vo.setProgress(m.getProgress());
        vo.setPlannedDate(m.getPlannedDate());
        vo.setActualDate(m.getActualDate());
        vo.setAssigneeId(m.getAssigneeId());
        vo.setDeliverable(m.getDeliverable());
        vo.setParentMilestoneId(m.getParentMilestoneId());
        vo.setFlowInstanceId(m.getFlowInstanceId());
        vo.setTaskId(m.getTaskId());
        vo.setCreatedAt(m.getCreatedAt());
        vo.setUpdatedAt(m.getUpdatedAt());
        return vo;
    }

    private PhaseTreeVO toPhaseTreeVO(com.syncflow.project.entity.ProjectPhase p) {
        PhaseTreeVO vo = new PhaseTreeVO();
        vo.setId(p.getId());
        vo.setProjectId(p.getProjectId());
        vo.setName(p.getName());
        vo.setCode(p.getCode());
        vo.setSeqNo(p.getSeqNo());
        vo.setStatus(p.getStatus());
        vo.setProgress(p.getProgress());
        vo.setPlannedStart(p.getPlannedStart());
        vo.setPlannedEnd(p.getPlannedEnd());
        vo.setActualStart(p.getActualStart());
        vo.setActualEnd(p.getActualEnd());
        vo.setCreatedAt(p.getCreatedAt());
        vo.setUpdatedAt(p.getUpdatedAt());
        return vo;
    }

    private StageGateVO toStageGateVO(StageGate sg) {
        StageGateVO vo = new StageGateVO();
        vo.setId(sg.getId());
        vo.setPhaseId(sg.getPhaseId());
        vo.setName(sg.getName());
        vo.setGateType(sg.getGateType());
        vo.setStatus(sg.getStatus());
        vo.setFlowInstanceId(sg.getFlowInstanceId());
        vo.setTaskId(sg.getTaskId());
        vo.setApproverId(sg.getApproverId());
        vo.setApprovedAt(sg.getApprovedAt());
        vo.setComments(sg.getComments());
        vo.setCreatedAt(sg.getCreatedAt());
        vo.setUpdatedAt(sg.getUpdatedAt());
        return vo;
    }

    private LocalDate earliest(LocalDate current, LocalDate candidate) {
        if (current == null) return candidate;
        return candidate.isBefore(current) ? candidate : current;
    }

    private LocalDate latest(LocalDate current, LocalDate candidate) {
        if (current == null) return candidate;
        return candidate.isAfter(current) ? candidate : current;
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Long l) return l;
        if (value instanceof Number n) return n.longValue();
        return Long.parseLong(value.toString());
    }

    private Integer toInt(Object value) {
        if (value == null) return null;
        if (value instanceof Integer i) return i;
        if (value instanceof Number n) return n.intValue();
        return Integer.parseInt(value.toString());
    }

    private LocalDate toLocalDate(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDate ld) return ld;
        return LocalDate.parse(value.toString());
    }

    // -----------------------------------------------------------------------
    //  Project member management
    // -----------------------------------------------------------------------

    @Override
    public List<ProjectMemberVO> getMembers(Long projectId) {
        // Verify project exists
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }

        LambdaQueryWrapper<ProjectMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProjectMember::getProjectId, projectId);
        List<ProjectMember> members = projectMemberMapper.selectList(wrapper);

        return members.stream().map(m -> {
            ProjectMemberVO vo = new ProjectMemberVO();
            vo.setId(m.getId());
            vo.setUserId(m.getUserId());
            vo.setProjectRole(m.getProjectRole());
            vo.setDeptId(m.getDeptId());
            vo.setJoinedAt(m.getJoinedAt());

            // Resolve user name
            if (m.getUserId() != null) {
                vo.setUserName(sysUserMapper.selectRealNameById(m.getUserId()));
            }
            // Resolve department name
            if (m.getDeptId() != null) {
                vo.setDeptName(sysDepartmentMapper.selectNameById(m.getDeptId()));
            }

            return vo;
        }).collect(Collectors.toList());
    }

    @Override
    public void addMember(Long projectId, Long userId, String projectRole, Long deptId) {
        // Verify project exists
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }

        // Check for existing membership (project_id + user_id unique)
        LambdaQueryWrapper<ProjectMember> existWrapper = new LambdaQueryWrapper<>();
        existWrapper.eq(ProjectMember::getProjectId, projectId)
                    .eq(ProjectMember::getUserId, userId);
        Long count = projectMemberMapper.selectCount(existWrapper);
        if (count > 0) {
            throw new BusinessException(ErrorCode.MEMBER_ALREADY_EXISTS,
                    "User " + userId + " is already a member of project " + projectId);
        }

        ProjectMember member = new ProjectMember();
        member.setProjectId(projectId);
        member.setUserId(userId);
        member.setProjectRole(projectRole);
        member.setDeptId(deptId);
        projectMemberMapper.insert(member);
    }

    @Override
    public void removeMember(Long projectId, Long userId) {
        // Verify project exists
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }

        LambdaQueryWrapper<ProjectMember> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProjectMember::getProjectId, projectId)
               .eq(ProjectMember::getUserId, userId);
        projectMemberMapper.delete(wrapper);
    }

    @Override
    public void updateProjectStatus(Long id, Integer status) {
        if (status == null || status < 0 || status > 5) {
            throw new BusinessException(ErrorCode.PARAM_ERROR,
                    "Invalid project status: " + status + ". Must be 0-5");
        }
        Project project = projectMapper.selectById(id);
        if (project == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }
        project.setStatus(status);
        projectMapper.updateById(project);
    }

    // -----------------------------------------------------------------------
    //  Navigation tree
    // -----------------------------------------------------------------------

    @Override
    public List<TreeNodeVO> getNavigationTree() {
        List<Project> allProjects = projectMapper.selectProjectTree();
        if (allProjects.isEmpty()) {
            return List.of();
        }

        List<TreeNodeVO> roots = new ArrayList<>();
        Map<Long, TreeNodeVO> nodeMap = new LinkedHashMap<>();

        for (Project p : allProjects) {
            TreeNodeVO node = new TreeNodeVO();
            node.setId(String.valueOf(p.getId()));
            node.setName(p.getName());
            node.setType("project");
            node.setProgress(p.getProgress());
            node.setChildren(new ArrayList<>());
            nodeMap.put(p.getId(), node);
        }

        for (Project p : allProjects) {
            TreeNodeVO node = nodeMap.get(p.getId());
            if (p.getParentId() != null && nodeMap.containsKey(p.getParentId())) {
                nodeMap.get(p.getParentId()).getChildren().add(node);
            } else {
                roots.add(node);
            }
        }

        // Add phases as children of each project
        for (Project p : allProjects) {
            TreeNodeVO projectNode = nodeMap.get(p.getId());
            List<com.syncflow.project.entity.ProjectPhase> phases =
                    phaseMapper.selectByProjectId(p.getId());
            for (com.syncflow.project.entity.ProjectPhase phase : phases) {
                TreeNodeVO phaseNode = new TreeNodeVO();
                phaseNode.setId(String.valueOf(phase.getId()));
                phaseNode.setName(phase.getName());
                phaseNode.setType("stage");
                phaseNode.setProgress(phase.getProgress());
                phaseNode.setChildren(new ArrayList<>());
                projectNode.getChildren().add(phaseNode);
            }
        }

        return roots;
    }
}
