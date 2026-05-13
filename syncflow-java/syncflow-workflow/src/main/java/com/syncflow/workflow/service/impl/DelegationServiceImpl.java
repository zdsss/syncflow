package com.syncflow.workflow.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.workflow.entity.Delegation;
import com.syncflow.workflow.mapper.CrossModuleMapper;
import com.syncflow.workflow.mapper.DelegationMapper;
import com.syncflow.workflow.service.DelegationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Implementation of {@link DelegationService}.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DelegationServiceImpl implements DelegationService {

    private final DelegationMapper delegationMapper;
    private final CrossModuleMapper crossModuleMapper;

    @Override
    @Transactional
    public void delegate(Long businessObjectId, Long fromUserId, Long toUserId,
                         String reason, LocalDateTime startTime, LocalDateTime endTime) {
        // Validate delegated user is active (selectUserRealName returns null for disabled/missing users)
        String toUserName = crossModuleMapper.selectUserRealName(toUserId);
        if (toUserName == null) {
            throw new IllegalArgumentException("Cannot delegate to user " + toUserId + ": user not found or disabled");
        }

        Delegation delegation = new Delegation();
        delegation.setBusinessObjectId(businessObjectId);
        delegation.setFromUserId(fromUserId);
        delegation.setToUserId(toUserId);
        delegation.setReason(reason);
        delegation.setStartTime(startTime);
        delegation.setEndTime(endTime);
        delegation.setIsActive(true);
        delegation.setCreatedAt(LocalDateTime.now());

        delegationMapper.insert(delegation);
        log.info("Delegation created: fromUser={} toUser={} ({}) bizObj={}", fromUserId, toUserId, toUserName, businessObjectId);
    }

    @Override
    @Transactional
    public void revoke(Long delegationId, Long userId) {
        Delegation delegation = delegationMapper.selectById(delegationId);
        if (delegation == null) {
            throw new IllegalArgumentException("Delegation not found: " + delegationId);
        }
        if (!delegation.getFromUserId().equals(userId)) {
            throw new IllegalStateException("Only the delegator can revoke a delegation");
        }

        delegation.setIsActive(false);
        delegationMapper.updateById(delegation);
        log.info("Delegation {} revoked by user {}", delegationId, userId);
    }

    @Override
    public List<Delegation> getActiveDelegations(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LambdaQueryWrapper<Delegation> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Delegation::getFromUserId, userId)
               .eq(Delegation::getIsActive, true)
               .le(Delegation::getStartTime, now)
               .and(w -> w.isNull(Delegation::getEndTime)
                         .or()
                         .ge(Delegation::getEndTime, now));

        return delegationMapper.selectList(wrapper);
    }

    @Override
    public Long resolveDelegatedApprover(Long originalApproverId, Long businessObjectId) {
        LocalDateTime now = LocalDateTime.now();

        // 1. Try specific delegation for this business object
        if (businessObjectId != null) {
            LambdaQueryWrapper<Delegation> specificWrapper = new LambdaQueryWrapper<>();
            specificWrapper.eq(Delegation::getFromUserId, originalApproverId)
                   .eq(Delegation::getBusinessObjectId, businessObjectId)
                   .eq(Delegation::getIsActive, true)
                   .le(Delegation::getStartTime, now)
                   .and(w -> w.isNull(Delegation::getEndTime).or().ge(Delegation::getEndTime, now))
                   .last("LIMIT 1");
            Delegation delegation = delegationMapper.selectOne(specificWrapper);
            if (delegation != null) {
                Long delegatedUserId = delegation.getToUserId();
                if (isUserActive(delegatedUserId)) {
                    log.info("Resolved specific delegated approver: original={} -> delegated={} for bo={}",
                             originalApproverId, delegatedUserId, businessObjectId);
                    return delegatedUserId;
                }
                log.warn("Delegated user {} is not active, falling back to original approver {}", delegatedUserId, originalApproverId);
            }
        }

        // 2. Fallback to global delegation (businessObjectId IS NULL)
        LambdaQueryWrapper<Delegation> globalWrapper = new LambdaQueryWrapper<>();
        globalWrapper.eq(Delegation::getFromUserId, originalApproverId)
               .isNull(Delegation::getBusinessObjectId)
               .eq(Delegation::getIsActive, true)
               .le(Delegation::getStartTime, now)
               .and(w -> w.isNull(Delegation::getEndTime).or().ge(Delegation::getEndTime, now))
               .last("LIMIT 1");
        Delegation delegation = delegationMapper.selectOne(globalWrapper);

        if (delegation != null) {
            Long delegatedUserId = delegation.getToUserId();
            if (isUserActive(delegatedUserId)) {
                log.info("Resolved global delegated approver: original={} -> delegated={}",
                         originalApproverId, delegatedUserId);
                return delegatedUserId;
            }
            log.warn("Delegated user {} is not active, falling back to original approver {}", delegatedUserId, originalApproverId);
        }
        return originalApproverId;
    }

    private boolean isUserActive(Long userId) {
        if (userId == null) return false;
        return crossModuleMapper.selectUserRealName(userId) != null;
    }
}
