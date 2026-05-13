package com.syncflow.workflow.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.workflow.entity.CcRecord;
import com.syncflow.workflow.mapper.CcRecordMapper;
import com.syncflow.workflow.service.CcRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Implementation of {@link CcRecordService}.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CcRecordServiceImpl implements CcRecordService {

    private final CcRecordMapper ccRecordMapper;

    @Override
    @Transactional
    public void addCc(Long businessObjectId, Long userId) {
        CcRecord ccRecord = new CcRecord();
        ccRecord.setBusinessObjectId(businessObjectId);
        ccRecord.setUserId(userId);
        ccRecord.setIsRead(false);
        ccRecord.setCreatedAt(LocalDateTime.now());

        ccRecordMapper.insert(ccRecord);
        log.info("CC record added: bizObj={} user={}", businessObjectId, userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long ccRecordId, Long userId) {
        CcRecord ccRecord = ccRecordMapper.selectById(ccRecordId);
        if (ccRecord == null) {
            throw new IllegalArgumentException("CC record not found: " + ccRecordId);
        }
        if (!ccRecord.getUserId().equals(userId)) {
            throw new IllegalStateException("Only the CC recipient can mark as read");
        }

        ccRecord.setIsRead(true);
        ccRecord.setReadAt(LocalDateTime.now());
        ccRecordMapper.updateById(ccRecord);
        log.info("CC record {} marked as read by user {}", ccRecordId, userId);
    }

    @Override
    public List<CcRecord> getCcRecords(Long userId, boolean unreadOnly) {
        LambdaQueryWrapper<CcRecord> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CcRecord::getUserId, userId);
        if (unreadOnly) {
            wrapper.eq(CcRecord::getIsRead, false);
        }
        wrapper.orderByDesc(CcRecord::getCreatedAt);

        return ccRecordMapper.selectList(wrapper);
    }
}
