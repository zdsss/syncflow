package com.syncflow.project.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.project.dto.PhaseTreeVO;
import com.syncflow.project.entity.Milestone;
import com.syncflow.project.entity.Project;
import com.syncflow.project.entity.ProjectPhase;
import com.syncflow.project.entity.StageGate;
import com.syncflow.project.mapper.MilestoneMapper;
import com.syncflow.project.mapper.PhaseMapper;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.project.mapper.StageGateMapper;
import com.syncflow.project.service.PhaseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Implementation of {@link PhaseService}.
 */
@Service
public class PhaseServiceImpl implements PhaseService {

    private final PhaseMapper phaseMapper;
    private final ProjectMapper projectMapper;
    private final MilestoneMapper milestoneMapper;
    private final StageGateMapper stageGateMapper;

    public PhaseServiceImpl(PhaseMapper phaseMapper,
                            ProjectMapper projectMapper,
                            MilestoneMapper milestoneMapper,
                            StageGateMapper stageGateMapper) {
        this.phaseMapper = phaseMapper;
        this.projectMapper = projectMapper;
        this.milestoneMapper = milestoneMapper;
        this.stageGateMapper = stageGateMapper;
    }

    @Override
    @Transactional
    public PhaseTreeVO createPhase(Long projectId, String name, String code) {
        // Verify project exists
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }

        // Determine next seqNo
        LambdaQueryWrapper<ProjectPhase> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProjectPhase::getProjectId, projectId)
               .orderByDesc(ProjectPhase::getSeqNo)
               .last("LIMIT 1");
        ProjectPhase lastPhase = phaseMapper.selectOne(wrapper);
        int nextSeqNo = (lastPhase != null && lastPhase.getSeqNo() != null)
                ? lastPhase.getSeqNo() + 1
                : 1;

        ProjectPhase phase = new ProjectPhase();
        phase.setProjectId(projectId);
        phase.setName(name);
        phase.setCode(code);
        phase.setSeqNo(nextSeqNo);
        phase.setStatus(1); // not_started
        phase.setProgress(0);

        phaseMapper.insert(phase);
        return toPhaseTreeVO(phase);
    }

    @Override
    @Transactional
    public PhaseTreeVO updatePhase(Long id, String name, String code) {
        ProjectPhase phase = phaseMapper.selectById(id);
        if (phase == null) {
            throw new BusinessException(ErrorCode.PHASE_NOT_FOUND);
        }

        if (StringUtils.hasText(name)) {
            phase.setName(name);
        }
        if (StringUtils.hasText(code)) {
            phase.setCode(code);
        }

        phaseMapper.updateById(phase);
        return toPhaseTreeVO(phase);
    }

    @Override
    @Transactional
    public void deletePhase(Long id) {
        ProjectPhase phase = phaseMapper.selectById(id);
        if (phase == null) {
            throw new BusinessException(ErrorCode.PHASE_NOT_FOUND);
        }

        // Check no milestones exist for this phase
        LambdaQueryWrapper<Milestone> msWrapper = new LambdaQueryWrapper<>();
        msWrapper.eq(Milestone::getPhaseId, id);
        Long msCount = milestoneMapper.selectCount(msWrapper);
        if (msCount > 0) {
            throw new BusinessException(ErrorCode.PHASE_HAS_MILESTONES);
        }

        // Delete associated stage gates first
        LambdaQueryWrapper<StageGate> sgWrapper = new LambdaQueryWrapper<>();
        sgWrapper.eq(StageGate::getPhaseId, id);
        stageGateMapper.delete(sgWrapper);

        phaseMapper.deleteById(id);
    }

    @Override
    @Transactional
    public void reorderPhases(Long projectId, Map<Long, Integer> phaseIdSeqNos) {
        // Verify project exists
        Project project = projectMapper.selectById(projectId);
        if (project == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }

        for (Map.Entry<Long, Integer> entry : phaseIdSeqNos.entrySet()) {
            Long phaseId = entry.getKey();
            Integer seqNo = entry.getValue();

            ProjectPhase phase = phaseMapper.selectById(phaseId);
            if (phase == null) {
                throw new BusinessException(ErrorCode.PHASE_NOT_FOUND,
                        "Phase not found: " + phaseId);
            }
            if (!phase.getProjectId().equals(projectId)) {
                throw new BusinessException(ErrorCode.PARAM_ERROR,
                        "Phase " + phaseId + " does not belong to project " + projectId);
            }

            phase.setSeqNo(seqNo);
            phaseMapper.updateById(phase);
        }
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    private PhaseTreeVO toPhaseTreeVO(ProjectPhase p) {
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
        vo.setMilestones(new ArrayList<>());
        vo.setStageGates(new ArrayList<>());
        return vo;
    }
}
