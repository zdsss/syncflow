package com.syncflow.bom.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.admin.entity.User;
import com.syncflow.admin.mapper.UserMapper;
import com.syncflow.bom.dto.*;
import com.syncflow.bom.entity.Bom;
import com.syncflow.bom.entity.BomItem;
import com.syncflow.bom.entity.BomVersion;
import com.syncflow.bom.enums.BomStatus;
import com.syncflow.bom.mapper.BomItemMapper;
import com.syncflow.bom.mapper.BomMapper;
import com.syncflow.bom.mapper.BomVersionMapper;
import com.syncflow.bom.service.BomService;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.project.entity.Project;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.workflow.service.WorkflowService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * BOM management service implementation.
 */
@Service
public class BomServiceImpl implements BomService {

    private static final Logger log = LoggerFactory.getLogger(BomServiceImpl.class);

    private final BomMapper bomMapper;
    private final BomItemMapper bomItemMapper;
    private final BomVersionMapper bomVersionMapper;
    private final UserMapper userMapper;
    private final ProjectMapper projectMapper;
    private final WorkflowService workflowService;
    private final ObjectMapper objectMapper;

    @Lazy
    private com.syncflow.workflow.service.ChangeApprovalInterceptor changeInterceptor;

    @Autowired
    public void setChangeInterceptor(@Lazy com.syncflow.workflow.service.ChangeApprovalInterceptor changeInterceptor) {
        this.changeInterceptor = changeInterceptor;
    }

    public BomServiceImpl(BomMapper bomMapper,
                          BomItemMapper bomItemMapper,
                          BomVersionMapper bomVersionMapper,
                          UserMapper userMapper,
                          ProjectMapper projectMapper,
                          @Lazy WorkflowService workflowService,
                          ObjectMapper objectMapper) {
        this.bomMapper = bomMapper;
        this.bomItemMapper = bomItemMapper;
        this.bomVersionMapper = bomVersionMapper;
        this.userMapper = userMapper;
        this.projectMapper = projectMapper;
        this.workflowService = workflowService;
        this.objectMapper = objectMapper;
    }

    // -----------------------------------------------------------------------
    //  List & Detail
    // -----------------------------------------------------------------------

    @Override
    public List<BomVO> listBoms(Long projectId) {
        LambdaQueryWrapper<Bom> wrapper = new LambdaQueryWrapper<>();
        if (projectId != null) {
            wrapper.eq(Bom::getProjectId, projectId);
        }
        wrapper.orderByDesc(Bom::getCreatedAt);

        List<Bom> boms = bomMapper.selectList(wrapper);
        return boms.stream().map(this::toBomVO).collect(Collectors.toList());
    }

    @Override
    public BomVO getBomDetail(Long id) {
        Bom bom = getBomOrThrow(id);
        return toBomVO(bom);
    }

    // -----------------------------------------------------------------------
    //  Create
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public BomVO createBom(CreateBomDTO dto) {
        Long currentUserId = SecurityUtils.getUserId();

        Bom bom = new Bom();
        bom.setBomNo(generateBomNo());
        bom.setName(dto.getName());
        bom.setVersion("1.0");
        bom.setProjectId(dto.getProjectId());
        bom.setOrderProductId(dto.getOrderProductId());
        bom.setProductCode(dto.getProductCode());
        bom.setProductName(dto.getProductName());
        bom.setStatus(BomStatus.EDITING.getCode());
        bom.setIsLatest(true);
        bom.setParentBomId(dto.getParentBomId());
        bom.setChangeSummary(dto.getChangeSummary());
        bom.setTotalItems(0);
        bom.setTenantId(1L);
        bom.setCreatedBy(currentUserId);

        bomMapper.insert(bom);

        // Record initial version (no items yet, snapshotJson is empty array)
        BomVersion version = new BomVersion();
        version.setBomId(bom.getId());
        version.setVersion("1.0");
        version.setChangeSummary("创建BOM");
        version.setCreatedBy(currentUserId);
        version.setSnapshotJson("[]");
        bomVersionMapper.insert(version);

        return toBomVO(bom);
    }

    // -----------------------------------------------------------------------
    //  BOM Structure (tree)
    // -----------------------------------------------------------------------

    @Override
    public List<BomItemTreeVO> getBomStructure(Long bomId) {
        getBomOrThrow(bomId);

        LambdaQueryWrapper<BomItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BomItem::getBomId, bomId)
               .orderByAsc(BomItem::getSeqNo)
               .orderByAsc(BomItem::getId);

        List<BomItem> items = bomItemMapper.selectList(wrapper);
        return buildTree(items, null);
    }

    // -----------------------------------------------------------------------
    //  BOM Item CRUD
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public BomItemTreeVO addBomItem(Long bomId, CreateBomItemDTO dto) {
        ensureBomEditable(bomId, "ADD_ITEM", dto);
        Bom bom = getBomOrThrow(bomId);

        BomItem item = new BomItem();
        item.setBomId(bomId);
        item.setParentId(dto.getParentId());
        item.setSeqNo(dto.getSeqNo() != null ? dto.getSeqNo() : 0);
        item.setMaterialCode(dto.getMaterialCode());
        item.setDrawingNo(dto.getDrawingNo());
        item.setName(dto.getName());
        item.setSpecification(dto.getSpecification());
        item.setMaterial(dto.getMaterial());
        item.setSurfaceTreatment(dto.getSurfaceTreatment());
        item.setUnit(dto.getUnit());
        item.setUnitPrice(dto.getUnitPrice());
        item.setWeight(dto.getWeight());
        item.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : BigDecimal.ONE);
        item.setSourceType(dto.getSourceType());
        item.setIsVirtual(dto.getIsVirtual() != null && dto.getIsVirtual());
        item.setStorageLocation(dto.getStorageLocation());
        item.setUnitOfMeasure(dto.getUnitOfMeasure());
        item.setIncomingInspection(dto.getIncomingInspection());
        item.setIsOptional(dto.getIsOptional() != null && dto.getIsOptional());
        item.setRemark(dto.getRemark());

        // Compute level and path
        if (dto.getParentId() != null) {
            BomItem parent = bomItemMapper.selectById(dto.getParentId());
            if (parent == null || !parent.getBomId().equals(bomId)) {
                throw new BusinessException(ErrorCode.PARAM_ERROR, "父项不存在或不属于该BOM");
            }
            // Depth limit: prevent excessively deep hierarchies
            if (parent.getLevel() != null && parent.getLevel() >= 10) {
                throw new BusinessException(ErrorCode.PARAM_ERROR, "BOM层级不能超过10层");
            }
            item.setLevel(parent.getLevel() + 1);
            item.setPath(parent.getPath() != null ? parent.getPath() + "," + parent.getId() : String.valueOf(parent.getId()));
            item.setLevelNo(parent.getLevelNo() != null ? parent.getLevelNo() + "." + (getNextChildSeq(bomId, dto.getParentId()) + 1) : "1.1");
        } else {
            item.setLevel(1);
            item.setPath(null);
            item.setLevelNo(String.valueOf(getNextChildSeq(bomId, null) + 1));
        }

        // Compute total weight
        if (item.getWeight() != null && item.getQuantity() != null) {
            item.setTotalWeight(item.getWeight().multiply(item.getQuantity()));
        }

        bomItemMapper.insert(item);

        // Update BOM total items count
        recalculateBomTotals(bomId);

        return toItemTreeVO(item);
    }

    @Override
    @Transactional
    public BomItemTreeVO updateBomItem(Long itemId, CreateBomItemDTO dto) {
        BomItem item = bomItemMapper.selectById(itemId);
        if (item == null) {
            throw new BusinessException(ErrorCode.BOM_NOT_FOUND, "BOM子项不存在");
        }
        ensureBomEditable(item.getBomId(), "UPDATE_ITEM", dto);

        item.setSeqNo(dto.getSeqNo() != null ? dto.getSeqNo() : item.getSeqNo());
        item.setMaterialCode(dto.getMaterialCode());
        item.setDrawingNo(dto.getDrawingNo());
        item.setName(dto.getName());
        item.setSpecification(dto.getSpecification());
        item.setMaterial(dto.getMaterial());
        item.setSurfaceTreatment(dto.getSurfaceTreatment());
        item.setUnit(dto.getUnit());
        item.setUnitPrice(dto.getUnitPrice());
        item.setWeight(dto.getWeight());
        if (dto.getQuantity() != null) {
            item.setQuantity(dto.getQuantity());
        }
        item.setSourceType(dto.getSourceType());
        if (dto.getIsVirtual() != null) {
            item.setIsVirtual(dto.getIsVirtual());
        }
        item.setStorageLocation(dto.getStorageLocation());
        item.setUnitOfMeasure(dto.getUnitOfMeasure());
        item.setIncomingInspection(dto.getIncomingInspection());
        if (dto.getIsOptional() != null) {
            item.setIsOptional(dto.getIsOptional());
        }
        item.setRemark(dto.getRemark());

        // Recompute total weight
        if (item.getWeight() != null && item.getQuantity() != null) {
            item.setTotalWeight(item.getWeight().multiply(item.getQuantity()));
        }

        bomItemMapper.updateById(item);

        // Recalculate BOM totals
        recalculateBomTotals(item.getBomId());

        return toItemTreeVO(item);
    }

    @Override
    @Transactional
    public void deleteBomItem(Long itemId) {
        BomItem item = bomItemMapper.selectById(itemId);
        if (item == null) {
            throw new BusinessException(ErrorCode.BOM_NOT_FOUND, "BOM子项不存在");
        }
        ensureBomEditable(item.getBomId(), "DELETE_ITEM", Map.of("itemId", itemId));

        Long bomId = item.getBomId();

        // Delete all descendants first
        deleteDescendants(bomId, itemId);

        // Delete the item itself
        bomItemMapper.deleteById(itemId);

        // Recalculate BOM totals
        recalculateBomTotals(bomId);
    }

    // -----------------------------------------------------------------------
    //  Approval
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public void submitForApproval(Long bomId) {
        Bom bom = getBomOrThrow(bomId);

        if (bom.getStatus() != BomStatus.EDITING.getCode()) {
            throw new BusinessException(ErrorCode.BOM_PENDING_APPROVAL, "只有编辑中的BOM才能提交审批");
        }

        bom.setStatus(BomStatus.PENDING_APPROVAL.getCode());
        bomMapper.updateById(bom);

        // Start Flowable approval process
        Long businessObjectId = workflowService.startProcess(
                "BOM_APPROVAL", bomId, "BOM",
                bom.getName() + " V" + bom.getVersion(),
                bom.getProjectId(), SecurityUtils.getUserId()
        );

        // Link the flow instance back to BOM
        com.syncflow.workflow.entity.BusinessObject bo =
                workflowService.getBusinessObjectEntity(businessObjectId);
        if (bo != null && bo.getFlowInstanceId() != null) {
            bom.setFlowInstanceId(bo.getFlowInstanceId());
            bomMapper.updateById(bom);
        }
    }

    @Override
    @Transactional
    public void withdrawApproval(Long bomId) {
        Bom bom = getBomOrThrow(bomId);
        if (bom.getStatus() != BomStatus.PENDING_APPROVAL.getCode()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "只有审批中的BOM才能撤回");
        }

        // Find the business object for this BOM
        com.syncflow.workflow.entity.BusinessObject bo =
                workflowService.findBusinessObject("BOM", bomId);
        if (bo != null) {
            workflowService.withdrawApproval(bo.getId(), SecurityUtils.getUserId());
        }

        bom.setStatus(BomStatus.EDITING.getCode());
        bom.setFlowInstanceId(null);
        bomMapper.updateById(bom);
    }

    // -----------------------------------------------------------------------
    //  Version management
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public BomVO saveVersion(Long bomId, String changeSummary) {
        Bom bom = getBomOrThrow(bomId);
        Long currentUserId = SecurityUtils.getUserId();

        // Determine next version number
        String currentVersion = bom.getVersion() != null ? bom.getVersion() : "1.0";
        String nextVersion = incrementVersion(currentVersion);

        // Mark current BOM as not latest
        bom.setIsLatest(false);
        bomMapper.updateById(bom);

        // Create new BOM as a copy
        Bom newBom = new Bom();
        newBom.setBomNo(generateBomNo());
        newBom.setName(bom.getName());
        newBom.setVersion(nextVersion);
        newBom.setProjectId(bom.getProjectId());
        newBom.setOrderProductId(bom.getOrderProductId());
        newBom.setProductCode(bom.getProductCode());
        newBom.setProductName(bom.getProductName());
        newBom.setStatus(BomStatus.EDITING.getCode());
        newBom.setIsLatest(true);
        newBom.setParentBomId(bom.getId());
        newBom.setChangeSummary(changeSummary);
        newBom.setTotalItems(bom.getTotalItems());
        newBom.setTotalWeight(bom.getTotalWeight());
        newBom.setTenantId(bom.getTenantId());
        newBom.setCreatedBy(currentUserId);
        bomMapper.insert(newBom);

        // Copy all items to the new BOM
        copyBomItems(bomId, newBom.getId());

        // Build snapshot JSON from the newly copied items
        String snapshotJson = buildSnapshotJson(newBom.getId());

        // Record version in history with snapshot
        BomVersion version = new BomVersion();
        version.setBomId(newBom.getId());
        version.setVersion(nextVersion);
        version.setChangeSummary(changeSummary != null ? changeSummary : "版本更新");
        version.setCreatedBy(currentUserId);
        version.setSnapshotJson(snapshotJson);
        bomVersionMapper.insert(version);

        return toBomVO(newBom);
    }

    @Override
    public List<BomVersionVO> getVersionHistory(Long bomId) {
        // Walk the parentBomId chain to collect the full version family
        Set<Long> familyBomIds = collectVersionFamily(bomId);

        LambdaQueryWrapper<BomVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(BomVersion::getBomId, familyBomIds)
               .orderByDesc(BomVersion::getCreatedAt);

        List<BomVersion> versions = bomVersionMapper.selectList(wrapper);
        return versions.stream().map(this::toVersionVO).collect(Collectors.toList());
    }

    @Override
    public BomVersionCompareVO compareVersions(Long bomId, String v1, String v2) {
        // Validate that the BOM exists
        getBomOrThrow(bomId);

        // Collect all BOM IDs in the same version family (walk the parentBomId chain)
        Set<Long> familyBomIds = collectVersionFamily(bomId);

        // Find the BomVersion records for v1 and v2 within the family
        BomVersion bv1 = findVersionInFamily(familyBomIds, v1);
        BomVersion bv2 = findVersionInFamily(familyBomIds, v2);

        BomVersionCompareVO result = new BomVersionCompareVO();

        // Handle legacy records: snapshotJson may be null for records before this feature
        if (bv1 == null || bv1.getSnapshotJson() == null || bv2 == null || bv2.getSnapshotJson() == null) {
            log.warn("compareVersions: one or both versions ({}, {}) for bomId={} have no snapshot data; returning empty diff",
                    v1, v2, bomId);
            result.setAdded(Collections.emptyList());
            result.setRemoved(Collections.emptyList());
            result.setModified(Collections.emptyList());
            return result;
        }

        // Deserialize snapshots
        List<BomVersionCompareVO.BomItemSnapshot> list1 = deserializeSnapshot(bv1.getSnapshotJson());
        List<BomVersionCompareVO.BomItemSnapshot> list2 = deserializeSnapshot(bv2.getSnapshotJson());

        // Index by materialCode for O(n) diff
        Map<String, BomVersionCompareVO.BomItemSnapshot> map1 = indexByMaterialCode(list1);
        Map<String, BomVersionCompareVO.BomItemSnapshot> map2 = indexByMaterialCode(list2);

        List<BomVersionCompareVO.BomItemSnapshot> added = new ArrayList<>();
        List<BomVersionCompareVO.BomItemSnapshot> removed = new ArrayList<>();
        List<BomVersionCompareVO.ModifiedEntry> modified = new ArrayList<>();

        // Added: in v2 but not in v1
        for (Map.Entry<String, BomVersionCompareVO.BomItemSnapshot> entry : map2.entrySet()) {
            if (!map1.containsKey(entry.getKey())) {
                added.add(entry.getValue());
            }
        }

        // Removed: in v1 but not in v2
        for (Map.Entry<String, BomVersionCompareVO.BomItemSnapshot> entry : map1.entrySet()) {
            if (!map2.containsKey(entry.getKey())) {
                removed.add(entry.getValue());
            }
        }

        // Modified: in both, but with field differences
        for (Map.Entry<String, BomVersionCompareVO.BomItemSnapshot> entry : map1.entrySet()) {
            String code = entry.getKey();
            if (map2.containsKey(code)) {
                BomVersionCompareVO.BomItemSnapshot snap1 = entry.getValue();
                BomVersionCompareVO.BomItemSnapshot snap2 = map2.get(code);
                List<BomVersionCompareVO.FieldChange> changes = diffSnapshots(snap1, snap2);
                if (!changes.isEmpty()) {
                    BomVersionCompareVO.ModifiedEntry me = new BomVersionCompareVO.ModifiedEntry();
                    me.setItem(snap2);
                    me.setChanges(changes);
                    modified.add(me);
                }
            }
        }

        result.setAdded(added);
        result.setRemoved(removed);
        result.setModified(modified);
        return result;
    }

    @Override
    @Transactional
    public void rollbackVersion(Long bomId, String targetVersion) {
        getBomOrThrow(bomId);

        Set<Long> familyBomIds = collectVersionFamily(bomId);
        BomVersion target = findVersionInFamily(familyBomIds, targetVersion);
        if (target == null) {
            throw new BusinessException(ErrorCode.BOM_NOT_FOUND,
                    "Target version " + targetVersion + " not found in version family");
        }

        // Delete all current items of this BOM
        LambdaQueryWrapper<BomItem> deleteWrapper = new LambdaQueryWrapper<>();
        deleteWrapper.eq(BomItem::getBomId, bomId);
        bomItemMapper.delete(deleteWrapper);

        // Copy items from the BOM that owns the target version record
        copyBomItems(target.getBomId(), bomId);

        // Update the BOM's version label to reflect the rollback
        Bom update = new Bom();
        update.setId(bomId);
        update.setVersion(targetVersion);
        bomMapper.updateById(update);
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    /**
     * Ensure the BOM is in an editable state (status < 3).
     * Published (3), Locked (4), and Cancelled (5) BOMs cannot be directly modified.
     * For published BOMs, submits a change request via ChangeApprovalInterceptor.
     */
    private void ensureBomEditable(Long bomId, String changeType, Object changeData) {
        Bom bom = getBomOrThrow(bomId);
        if (bom.getStatus() != null && bom.getStatus() >= 3) {
            // Try to intercept as a change request for published BOMs
            if (bom.getStatus() == 3 && changeInterceptor != null) {
                boolean intercepted = changeInterceptor.intercept(
                        "BOM_CHANGE", bomId, bom.getStatus(), 3,
                        changeType, changeData, null,
                        bom.getProjectId(), SecurityUtils.getUserId());
                if (intercepted) {
                    throw new BusinessException(ErrorCode.BOM_CHANGE_SUBMITTED,
                            "已发布BOM的修改已提交变更审批，审批通过后自动生效");
                }
            }
            throw new BusinessException(ErrorCode.BOM_CANNOT_MODIFY,
                    "已发布或已锁定的BOM不能直接修改，请创建新版本或提交变更审批");
        }
    }

    private void ensureBomEditable(Long bomId) {
        ensureBomEditable(bomId, null, null);
    }

    private Bom getBomOrThrow(Long id) {
        Bom bom = bomMapper.selectById(id);
        if (bom == null) {
            throw new BusinessException(ErrorCode.BOM_NOT_FOUND);
        }
        return bom;
    }

    /**
     * Generate BOM number: BOM-YYYYMMDD-NNN.
     * Uses count-based sequence with retry on collision.
     */
    private String generateBomNo() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        LocalDate today = LocalDate.now();
        LambdaQueryWrapper<Bom> wrapper = new LambdaQueryWrapper<>();
        wrapper.ge(Bom::getCreatedAt, today.atStartOfDay())
               .lt(Bom::getCreatedAt, today.atTime(LocalTime.MAX));
        Long todayCount = bomMapper.selectCount(wrapper);

        int seq = (todayCount != null ? todayCount.intValue() : 0) + 1;
        String bomNo = String.format("BOM-%s-%03d", datePart, seq);

        // Retry with incremented seq if collision (handles concurrent inserts)
        for (int retry = 0; retry < 3; retry++) {
            LambdaQueryWrapper<Bom> checkWrapper = new LambdaQueryWrapper<>();
            checkWrapper.eq(Bom::getBomNo, bomNo);
            if (bomMapper.selectCount(checkWrapper) == 0) {
                return bomNo;
            }
            seq++;
            bomNo = String.format("BOM-%s-%03d", datePart, seq);
        }
        return bomNo;
    }

    /**
     * Build a tree structure from a flat list of BomItems.
     */
    private List<BomItemTreeVO> buildTree(List<BomItem> allItems, Long parentId) {
        List<BomItemTreeVO> tree = new ArrayList<>();
        for (BomItem item : allItems) {
            if (Objects.equals(item.getParentId(), parentId)) {
                BomItemTreeVO vo = toItemTreeVO(item);
                vo.setChildren(buildTree(allItems, item.getId()));
                tree.add(vo);
            }
        }
        return tree;
    }

    /**
     * Count siblings under a parent to compute the next sequence number.
     */
    private int getNextChildSeq(Long bomId, Long parentId) {
        LambdaQueryWrapper<BomItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BomItem::getBomId, bomId);
        if (parentId != null) {
            wrapper.eq(BomItem::getParentId, parentId);
        } else {
            wrapper.isNull(BomItem::getParentId);
        }
        Long count = bomItemMapper.selectCount(wrapper);
        return count != null ? count.intValue() : 0;
    }

    /**
     * Recalculate and persist the total_items and total_weight on the BOM.
     */
    private void recalculateBomTotals(Long bomId) {
        LambdaQueryWrapper<BomItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BomItem::getBomId, bomId);
        List<BomItem> items = bomItemMapper.selectList(wrapper);

        Bom bom = bomMapper.selectById(bomId);
        if (bom == null) return;

        bom.setTotalItems(items.size());

        BigDecimal totalWeight = items.stream()
                .filter(i -> i.getTotalWeight() != null)
                .map(BomItem::getTotalWeight)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        bom.setTotalWeight(totalWeight);

        bomMapper.updateById(bom);
    }

    /**
     * Delete all descendant items of a given parent item within a BOM.
     */
    private void deleteDescendants(Long bomId, Long parentId) {
        LambdaQueryWrapper<BomItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BomItem::getBomId, bomId)
               .eq(BomItem::getParentId, parentId);
        List<BomItem> children = bomItemMapper.selectList(wrapper);

        for (BomItem child : children) {
            deleteDescendants(bomId, child.getId());
            bomItemMapper.deleteById(child.getId());
        }
    }

    /**
     * Copy all items from source BOM to target BOM, preserving tree structure.
     */
    private void copyBomItems(Long sourceBomId, Long targetBomId) {
        LambdaQueryWrapper<BomItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BomItem::getBomId, sourceBomId)
               .orderByAsc(BomItem::getSeqNo)
               .orderByAsc(BomItem::getId);
        List<BomItem> sourceItems = bomItemMapper.selectList(wrapper);

        // Map: source item id -> new item id
        Map<Long, Long> idMapping = new HashMap<>();

        for (BomItem source : sourceItems) {
            BomItem copy = new BomItem();
            copy.setBomId(targetBomId);
            copy.setSeqNo(source.getSeqNo());
            copy.setLevel(source.getLevel());
            copy.setLevelNo(source.getLevelNo());
            copy.setMaterialCode(source.getMaterialCode());
            copy.setDrawingNo(source.getDrawingNo());
            copy.setName(source.getName());
            copy.setSpecification(source.getSpecification());
            copy.setMaterial(source.getMaterial());
            copy.setSurfaceTreatment(source.getSurfaceTreatment());
            copy.setUnit(source.getUnit());
            copy.setUnitPrice(source.getUnitPrice());
            copy.setWeight(source.getWeight());
            copy.setTotalWeight(source.getTotalWeight());
            copy.setQuantity(source.getQuantity());
            copy.setSourceType(source.getSourceType());
            copy.setIsVirtual(source.getIsVirtual());
            copy.setStorageLocation(source.getStorageLocation());
            copy.setUnitOfMeasure(source.getUnitOfMeasure());
            copy.setIncomingInspection(source.getIncomingInspection());
            copy.setIsOptional(source.getIsOptional());
            copy.setRemark(source.getRemark());

            // Resolve parent id in the new BOM
            if (source.getParentId() != null && idMapping.containsKey(source.getParentId())) {
                copy.setParentId(idMapping.get(source.getParentId()));
            } else {
                copy.setParentId(null);
            }

            bomItemMapper.insert(copy);
            idMapping.put(source.getId(), copy.getId());
        }
    }

    /**
     * Increment a version string like "1.0" -> "1.1", "1.9" -> "1.10", "2.0" -> "2.1".
     */
    private String incrementVersion(String version) {
        if (version == null || version.isBlank()) {
            return "1.0";
        }
        String[] parts = version.split("\\.");
        if (parts.length >= 2) {
            try {
                int minor = Integer.parseInt(parts[1]) + 1;
                return parts[0] + "." + minor;
            } catch (NumberFormatException e) {
                return version + ".1";
            }
        }
        return version + ".0";
    }

    /**
     * Serialize the current items of a BOM into a JSON snapshot string.
     * Returns "[]" on serialization failure (should not happen in practice).
     */
    private String buildSnapshotJson(Long bomId) {
        LambdaQueryWrapper<BomItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(BomItem::getBomId, bomId)
               .orderByAsc(BomItem::getSeqNo)
               .orderByAsc(BomItem::getId);
        List<BomItem> items = bomItemMapper.selectList(wrapper);

        List<BomVersionCompareVO.BomItemSnapshot> snapshots = items.stream()
                .map(item -> {
                    BomVersionCompareVO.BomItemSnapshot snap = new BomVersionCompareVO.BomItemSnapshot();
                    snap.setId(item.getId());
                    snap.setName(item.getName());
                    snap.setMaterialCode(item.getMaterialCode());
                    snap.setSpecification(item.getSpecification());
                    snap.setSourceType(item.getSourceType());
                    snap.setQuantity(item.getQuantity());
                    snap.setUnitOfMeasure(item.getUnitOfMeasure());
                    return snap;
                })
                .collect(Collectors.toList());

        try {
            return objectMapper.writeValueAsString(snapshots);
        } catch (Exception e) {
            log.error("Failed to serialize BOM snapshot for bomId={}: {}", bomId, e.getMessage());
            return "[]";
        }
    }

    /**
     * Walk the parentBomId chain to collect all BOM IDs in the same version family.
     * Starts from the given bomId, then traverses upward to the root,
     * then collects all descendants of the root.
     */
    private Set<Long> collectVersionFamily(Long bomId) {
        // Walk up to root (max 50 levels to prevent infinite loops from data corruption)
        Long rootId = bomId;
        Bom current = bomMapper.selectById(bomId);
        Set<Long> visited = new HashSet<>();
        visited.add(bomId);
        while (current != null && current.getParentBomId() != null) {
            if (visited.contains(current.getParentBomId())) break;
            rootId = current.getParentBomId();
            visited.add(rootId);
            if (visited.size() > 50) break;
            current = bomMapper.selectById(rootId);
        }

        // Collect all descendants from root (BFS, max 200 nodes)
        Set<Long> family = new LinkedHashSet<>();
        Queue<Long> queue = new LinkedList<>();
        queue.add(rootId);

        while (!queue.isEmpty() && family.size() < 200) {
            Long id = queue.poll();
            if (family.contains(id)) continue;
            family.add(id);

            LambdaQueryWrapper<Bom> childWrapper = new LambdaQueryWrapper<>();
            childWrapper.eq(Bom::getParentBomId, id);
            List<Bom> children = bomMapper.selectList(childWrapper);
            for (Bom child : children) {
                if (!family.contains(child.getId())) {
                    queue.add(child.getId());
                }
            }
        }

        return family;
    }

    /**
     * Find a BomVersion record whose bomId is in the given family and whose version string matches.
     */
    private BomVersion findVersionInFamily(Set<Long> familyBomIds, String version) {
        if (familyBomIds.isEmpty()) {
            return null;
        }
        // Query bom_version with version = ? and bomId IN (...)
        LambdaQueryWrapper<BomVersion> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(BomVersion::getBomId, familyBomIds)
               .eq(BomVersion::getVersion, version)
               .last("LIMIT 1");
        return bomVersionMapper.selectOne(wrapper);
    }

    /**
     * Deserialize a snapshotJson string into a list of BomItemSnapshot.
     * Returns empty list on error.
     */
    private List<BomVersionCompareVO.BomItemSnapshot> deserializeSnapshot(String json) {
        try {
            return objectMapper.readValue(json,
                    new TypeReference<List<BomVersionCompareVO.BomItemSnapshot>>() {});
        } catch (Exception e) {
            log.error("Failed to deserialize BOM snapshot JSON: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Index a snapshot list by a composite key (materialCode + name) for O(n) diff lookup.
     * Uses materialCode as primary key, with name as disambiguator for items sharing the same code.
     * Falls back to id-based key for items without materialCode.
     */
    private Map<String, BomVersionCompareVO.BomItemSnapshot> indexByMaterialCode(
            List<BomVersionCompareVO.BomItemSnapshot> list) {
        Map<String, BomVersionCompareVO.BomItemSnapshot> map = new LinkedHashMap<>();
        Map<String, Integer> keyCount = new HashMap<>();
        for (BomVersionCompareVO.BomItemSnapshot snap : list) {
            String baseKey = snap.getMaterialCode() != null
                    ? snap.getMaterialCode()
                    : (snap.getId() != null ? "id:" + snap.getId() : snap.getName());
            // Disambiguate duplicate keys by appending a counter
            int count = keyCount.getOrDefault(baseKey, 0);
            keyCount.put(baseKey, count + 1);
            String key = count == 0 ? baseKey : baseKey + "#" + count;
            map.put(key, snap);
        }
        return map;
    }

    /**
     * Compare two snapshots of the same item and return a list of field-level changes.
     * Compares: name, specification, quantity, sourceType, unitOfMeasure.
     */
    private List<BomVersionCompareVO.FieldChange> diffSnapshots(
            BomVersionCompareVO.BomItemSnapshot snap1,
            BomVersionCompareVO.BomItemSnapshot snap2) {
        List<BomVersionCompareVO.FieldChange> changes = new ArrayList<>();

        compareField(changes, "name", snap1.getName(), snap2.getName());
        compareField(changes, "specification", snap1.getSpecification(), snap2.getSpecification());
        compareField(changes, "quantity",
                snap1.getQuantity() != null ? snap1.getQuantity().toPlainString() : null,
                snap2.getQuantity() != null ? snap2.getQuantity().toPlainString() : null);
        compareField(changes, "sourceType", snap1.getSourceType(), snap2.getSourceType());
        compareField(changes, "unitOfMeasure", snap1.getUnitOfMeasure(), snap2.getUnitOfMeasure());

        return changes;
    }

    private void compareField(List<BomVersionCompareVO.FieldChange> changes,
                               String field, String oldVal, String newVal) {
        if (!Objects.equals(oldVal, newVal)) {
            BomVersionCompareVO.FieldChange fc = new BomVersionCompareVO.FieldChange();
            fc.setField(field);
            fc.setOldValue(oldVal);
            fc.setNewValue(newVal);
            changes.add(fc);
        }
    }

    /**
     * Convert Bom entity to BomVO with enriched display fields.
     */
    private BomVO toBomVO(Bom bom) {
        BomVO vo = new BomVO();
        vo.setId(bom.getId());
        vo.setBomNo(bom.getBomNo());
        vo.setName(bom.getName());
        vo.setVersion(bom.getVersion());
        vo.setProjectId(bom.getProjectId());
        vo.setOrderProductId(bom.getOrderProductId());
        vo.setProductCode(bom.getProductCode());
        vo.setProductName(bom.getProductName());
        vo.setStatus(bom.getStatus());
        vo.setFlowInstanceId(bom.getFlowInstanceId());
        vo.setIsLatest(bom.getIsLatest());
        vo.setParentBomId(bom.getParentBomId());
        vo.setChangeSummary(bom.getChangeSummary());
        vo.setTotalItems(bom.getTotalItems());
        vo.setTotalWeight(bom.getTotalWeight());
        vo.setTenantId(bom.getTenantId());
        vo.setCreatedBy(bom.getCreatedBy());
        vo.setApprovedBy(bom.getApprovedBy());
        vo.setApprovedAt(bom.getApprovedAt());
        vo.setReleasedAt(bom.getReleasedAt());
        vo.setCreatedAt(bom.getCreatedAt());
        vo.setUpdatedAt(bom.getUpdatedAt());

        // Status label
        try {
            BomStatus status = BomStatus.fromCode(bom.getStatus());
            vo.setStatusName(status.getLabel());
        } catch (IllegalArgumentException e) {
            vo.setStatusName("未知");
        }

        // Enrich creator name
        if (bom.getCreatedBy() != null) {
            User creator = userMapper.selectById(bom.getCreatedBy());
            if (creator != null) {
                vo.setCreatedByName(creator.getRealName());
            }
        }

        // Enrich approver name
        if (bom.getApprovedBy() != null) {
            User approver = userMapper.selectById(bom.getApprovedBy());
            if (approver != null) {
                vo.setApprovedByName(approver.getRealName());
            }
        }

        // Enrich project name
        if (bom.getProjectId() != null) {
            Project project = projectMapper.selectById(bom.getProjectId());
            if (project != null) {
                vo.setProjectName(project.getName());
            }
        }

        return vo;
    }

    /**
     * Convert BomItem entity to BomItemTreeVO (without children).
     */
    private BomItemTreeVO toItemTreeVO(BomItem item) {
        BomItemTreeVO vo = new BomItemTreeVO();
        vo.setId(item.getId());
        vo.setBomId(item.getBomId());
        vo.setParentId(item.getParentId());
        vo.setLevel(item.getLevel());
        vo.setPath(item.getPath());
        vo.setSeqNo(item.getSeqNo());
        vo.setLevelNo(item.getLevelNo());
        vo.setMaterialCode(item.getMaterialCode());
        vo.setDrawingNo(item.getDrawingNo());
        vo.setName(item.getName());
        vo.setSpecification(item.getSpecification());
        vo.setMaterial(item.getMaterial());
        vo.setSurfaceTreatment(item.getSurfaceTreatment());
        vo.setUnit(item.getUnit());
        vo.setUnitPrice(item.getUnitPrice());
        vo.setWeight(item.getWeight());
        vo.setTotalWeight(item.getTotalWeight());
        vo.setQuantity(item.getQuantity());
        vo.setSourceType(item.getSourceType());
        vo.setIsVirtual(item.getIsVirtual());
        vo.setStorageLocation(item.getStorageLocation());
        vo.setUnitOfMeasure(item.getUnitOfMeasure());
        vo.setIncomingInspection(item.getIncomingInspection());
        vo.setIsOptional(item.getIsOptional());
        vo.setRemark(item.getRemark());
        vo.setCreatedAt(item.getCreatedAt());
        vo.setUpdatedAt(item.getUpdatedAt());
        return vo;
    }

    /**
     * Convert BomVersion entity to BomVersionVO with enriched user name.
     */
    private BomVersionVO toVersionVO(BomVersion version) {
        BomVersionVO vo = new BomVersionVO();
        vo.setId(version.getId());
        vo.setBomId(version.getBomId());
        vo.setVersion(version.getVersion());
        vo.setChangeSummary(version.getChangeSummary());
        vo.setCreatedBy(version.getCreatedBy());
        vo.setCreatedAt(version.getCreatedAt());

        if (version.getCreatedBy() != null) {
            User user = userMapper.selectById(version.getCreatedBy());
            if (user != null) {
                vo.setCreatedByName(user.getRealName());
            }
        }

        return vo;
    }
}
