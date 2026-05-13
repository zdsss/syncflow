package com.syncflow.project.service.impl;

import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.project.dto.CreateMilestoneDTO;
import com.syncflow.project.dto.MilestoneVO;
import com.syncflow.project.entity.Milestone;
import com.syncflow.project.mapper.MilestoneMapper;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.project.service.MilestoneService;
import com.syncflow.workflow.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Implementation of {@link MilestoneService}.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MilestoneServiceImpl implements MilestoneService {

    private final MilestoneMapper milestoneMapper;
    private final ProjectMapper projectMapper;

    @Lazy
    private final WorkflowService workflowService;

    @Override
    @Transactional
    public MilestoneVO createMilestone(Long projectId, CreateMilestoneDTO dto) {
        // Verify project exists
        if (projectMapper.selectById(projectId) == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND,
                    "Project not found: " + projectId);
        }

        Milestone milestone = new Milestone();
        milestone.setProjectId(projectId);
        milestone.setName(dto.getName());
        milestone.setType(dto.getType() != null ? dto.getType() : "MILESTONE");
        milestone.setPlannedDate(dto.getDueDate());
        milestone.setDeliverable(dto.getDescription());
        milestone.setPhaseId(dto.getPhaseId());
        milestone.setAssigneeId(dto.getAssigneeId());
        milestone.setStatus(1); // not_started
        milestone.setProgress(0);

        milestoneMapper.insert(milestone);
        log.info("Milestone {} created for project {}", milestone.getId(), projectId);

        return toVO(milestone);
    }

    @Override
    @Transactional
    public MilestoneVO updateMilestone(Long milestoneId, CreateMilestoneDTO dto) {
        Milestone milestone = milestoneMapper.selectById(milestoneId);
        if (milestone == null) {
            throw new BusinessException(ErrorCode.MILESTONE_NOT_FOUND,
                    "Milestone not found: " + milestoneId);
        }

        milestone.setName(dto.getName());
        if (dto.getType() != null) {
            milestone.setType(dto.getType());
        }
        milestone.setPlannedDate(dto.getDueDate());
        milestone.setDeliverable(dto.getDescription());
        if (dto.getPhaseId() != null) {
            milestone.setPhaseId(dto.getPhaseId());
        }
        if (dto.getAssigneeId() != null) {
            milestone.setAssigneeId(dto.getAssigneeId());
        }

        milestoneMapper.updateById(milestone);
        log.info("Milestone {} updated", milestoneId);

        return toVO(milestone);
    }

    @Override
    @Transactional
    public MilestoneVO startMilestone(Long milestoneId) {
        Milestone milestone = milestoneMapper.selectById(milestoneId);
        if (milestone == null) {
            throw new BusinessException(ErrorCode.MILESTONE_NOT_FOUND,
                    "Milestone not found: " + milestoneId);
        }

        // Only not_started (1) milestones can be started
        if (!Integer.valueOf(1).equals(milestone.getStatus())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR,
                    "只有未开始的里程碑才能启动 (current status=" + milestone.getStatus() + ")");
        }

        milestone.setStatus(2); // in_progress
        milestoneMapper.updateById(milestone);
        log.info("Milestone {} started (status 1→2)", milestoneId);

        return toVO(milestone);
    }

    @Override
    @Transactional
    public void completeMilestone(Long milestoneId) {
        Milestone milestone = milestoneMapper.selectById(milestoneId);
        if (milestone == null) {
            throw new BusinessException(ErrorCode.MILESTONE_NOT_FOUND,
                    "Milestone not found: " + milestoneId);
        }

        // Only in_progress (2) milestones can be completed
        if (!Integer.valueOf(2).equals(milestone.getStatus())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR,
                    "只有进行中的里程碑才能完成 (current status=" + milestone.getStatus() + ")");
        }

        // If no deliverable defined, complete directly
        if (milestone.getDeliverable() == null || milestone.getDeliverable().isBlank()) {
            milestone.setStatus(3); // completed
            milestone.setActualDate(LocalDate.now());
            milestone.setProgress(100);
            milestoneMapper.updateById(milestone);
            log.info("Milestone {} completed directly (no deliverable)", milestoneId);
            return;
        }

        // Has deliverable → start approval workflow
        Long boId = workflowService.startProcess(
                "GENERIC_APPROVAL",
                milestoneId,
                "MILESTONE",
                milestone.getName(),
                milestone.getProjectId(),
                milestone.getAssigneeId(),
                null
        );

        // Link flow instance back to milestone
        var bo = workflowService.getBusinessObjectEntity(boId);
        if (bo != null) {
            milestone.setFlowInstanceId(bo.getFlowInstanceId());
            milestoneMapper.updateById(milestone);
        }

        log.info("Milestone {} submitted for approval (boId={})", milestoneId, boId);
    }

    private MilestoneVO toVO(Milestone m) {
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
}
