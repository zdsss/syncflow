package com.syncflow.workflow.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.workflow.dto.ApprovalConfigDTO;
import com.syncflow.workflow.dto.ApprovalConfigVO;
import com.syncflow.workflow.entity.ApprovalConfig;
import com.syncflow.workflow.mapper.ApprovalConfigMapper;
import com.syncflow.workflow.service.ApprovalConfigAuditService;
import com.syncflow.workflow.service.ApprovalConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of {@link ApprovalConfigService}.
 */
@Service
@RequiredArgsConstructor
public class ApprovalConfigServiceImpl implements ApprovalConfigService {

    private final ApprovalConfigMapper approvalConfigMapper;
    private final ApprovalConfigAuditService auditService;

    @Override
    public List<ApprovalConfigVO> list(String objectType, String processKey) {
        LambdaQueryWrapper<ApprovalConfig> wrapper = new LambdaQueryWrapper<>();
        if (objectType != null && !objectType.isBlank()) {
            wrapper.eq(ApprovalConfig::getObjectType, objectType);
        }
        if (processKey != null && !processKey.isBlank()) {
            wrapper.eq(ApprovalConfig::getProcessKey, processKey);
        }
        wrapper.orderByAsc(ApprovalConfig::getPriority);

        List<ApprovalConfig> configs = approvalConfigMapper.selectList(wrapper);
        return configs.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public ApprovalConfigVO getById(Long id) {
        ApprovalConfig config = approvalConfigMapper.selectById(id);
        if (config == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Approval config not found: " + id);
        }
        return toVO(config);
    }

    @Override
    @Transactional
    public ApprovalConfigVO create(ApprovalConfigDTO dto) {
        ApprovalConfig config = new ApprovalConfig();
        BeanUtils.copyProperties(dto, config);
        config.setCreatedAt(LocalDateTime.now());
        config.setUpdatedAt(LocalDateTime.now());

        approvalConfigMapper.insert(config);

        auditService.record(config.getId(), "CREATE", null, null, null);

        return toVO(config);
    }

    @Override
    @Transactional
    public ApprovalConfigVO update(Long id, ApprovalConfigDTO dto) {
        ApprovalConfig existing = approvalConfigMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Approval config not found: " + id);
        }

        BeanUtils.copyProperties(dto, existing);
        existing.setUpdatedAt(LocalDateTime.now());

        approvalConfigMapper.updateById(existing);

        auditService.record(id, "UPDATE", null, null, null);

        return toVO(existing);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        ApprovalConfig existing = approvalConfigMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Approval config not found: " + id);
        }

        approvalConfigMapper.deleteById(id);

        auditService.record(id, "DELETE", null, null, null);
    }

    @Override
    @Transactional
    public void toggle(Long id) {
        ApprovalConfig existing = approvalConfigMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Approval config not found: " + id);
        }

        boolean oldEnabled = Boolean.TRUE.equals(existing.getEnabled());
        existing.setEnabled(!oldEnabled);
        existing.setUpdatedAt(LocalDateTime.now());

        approvalConfigMapper.updateById(existing);

        String action = existing.getEnabled() ? "ENABLE" : "DISABLE";
        auditService.record(id, action, "enabled",
                String.valueOf(oldEnabled), String.valueOf(existing.getEnabled()));
    }

    // -----------------------------------------------------------------------
    //  Mapping helpers
    // -----------------------------------------------------------------------

    private ApprovalConfigVO toVO(ApprovalConfig entity) {
        ApprovalConfigVO vo = new ApprovalConfigVO();
        BeanUtils.copyProperties(entity, vo);
        return vo;
    }
}
