package com.syncflow.bom.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.bom.entity.Bom;
import com.syncflow.bom.entity.BomItem;
import com.syncflow.bom.mapper.BomItemMapper;
import com.syncflow.bom.mapper.BomMapper;
import com.syncflow.workflow.entity.ChangeRequest;
import com.syncflow.workflow.mapper.ChangeRequestMapper;
import com.syncflow.workflow.service.ApprovalCallbackHandler;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Handles approval lifecycle for BOM_CHANGE objects.
 * On approval, applies the pending change data to the BOM.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class BomChangeApprovalCallback implements ApprovalCallbackHandler {

    private final ChangeRequestMapper changeRequestMapper;
    private final BomItemMapper bomItemMapper;
    private final BomMapper bomMapper;
    private final ObjectMapper objectMapper;

    @Override
    public Set<String> supportedObjectTypes() {
        return Set.of("BOM_CHANGE");
    }

    @Override
    @Transactional
    public void onApproved(Long objectId, Long approverId) {
        // objectId here is the ChangeRequest PK (crId), not the BOM id.
        // ChangeApprovalInterceptor passes crId as the workflow objectId.
        ChangeRequest cr = changeRequestMapper.selectById(objectId);
        if (cr == null) {
            log.warn("BOM_CHANGE request for objectId={} not found, skipping callback", objectId);
            return;
        }

        if (cr.getStatus() != null && cr.getStatus() == 2) {
            log.info("BOM_CHANGE for objectId={} already applied, skipping duplicate callback", objectId);
            return;
        }

        try {
            applyChange(cr);
            cr.setStatus(2); // applied
            cr.setResolvedBy(approverId);
            cr.setResolvedAt(java.time.LocalDateTime.now());
            changeRequestMapper.updateById(cr);
            log.info("BOM_CHANGE for objectId={} applied successfully", objectId);
        } catch (Exception e) {
            log.error("Failed to apply BOM_CHANGE for objectId={}", objectId, e);
            throw new RuntimeException("Failed to apply approved BOM change", e);
        }
    }

    @Override
    public void onRejected(Long objectId, String reason) {
        // objectId is the ChangeRequest PK (crId)
        ChangeRequest cr = changeRequestMapper.selectById(objectId);
        if (cr == null) {
            log.warn("BOM_CHANGE request id={} not found, skipping rejection callback", objectId);
            return;
        }
        cr.setStatus(3); // rejected
        cr.setResolvedAt(java.time.LocalDateTime.now());
        changeRequestMapper.updateById(cr);
        log.info("BOM_CHANGE cr={} rejected: {}", objectId, reason);
    }

    @Override
    public void onWithdrawn(Long objectId) {
        // objectId is the ChangeRequest PK (crId)
        ChangeRequest cr = changeRequestMapper.selectById(objectId);
        if (cr == null) return;
        cr.setStatus(4); // withdrawn (distinct from rejected=3)
        cr.setResolvedAt(java.time.LocalDateTime.now());
        changeRequestMapper.updateById(cr);
        log.info("BOM_CHANGE cr={} withdrawn", objectId);
    }

    @SuppressWarnings("unchecked")
    private void applyChange(ChangeRequest cr) throws Exception {
        String changeType = cr.getChangeType();
        if (changeType == null || changeType.isBlank()) {
            throw new IllegalStateException("ChangeRequest " + cr.getId() + " has null/empty changeType");
        }

        String changeData = cr.getChangeData();
        if (changeData == null || changeData.isBlank()) {
            throw new IllegalStateException("ChangeRequest " + cr.getId() + " has null/empty changeData");
        }

        Map<String, Object> data;
        try {
            data = objectMapper.readValue(changeData, Map.class);
        } catch (Exception e) {
            throw new IllegalStateException("ChangeRequest " + cr.getId() + " has invalid JSON changeData: " + e.getMessage(), e);
        }

        switch (changeType) {
            case "ADD_ITEM" -> applyAddItem(cr.getObjectId(), data);
            case "UPDATE_ITEM" -> {
                if (getLong(data, "itemId") == null) {
                    throw new IllegalStateException("ChangeRequest " + cr.getId() + " UPDATE_ITEM missing required field 'itemId'");
                }
                applyUpdateItem(data);
            }
            case "DELETE_ITEM" -> {
                if (getLong(data, "itemId") == null) {
                    throw new IllegalStateException("ChangeRequest " + cr.getId() + " DELETE_ITEM missing required field 'itemId'");
                }
                applyDeleteItem(data);
                recalculateBomTotals(cr.getObjectId());
            }
            default -> throw new IllegalStateException("Unknown BOM change type: " + changeType + " for ChangeRequest " + cr.getId());
        }
    }

    private void applyAddItem(Long bomId, Map<String, Object> data) {
        BomItem item = new BomItem();
        item.setBomId(bomId);
        item.setParentId(getLong(data, "parentId"));
        item.setSeqNo(getInt(data, "seqNo"));
        item.setMaterialCode(getString(data, "materialCode"));
        item.setDrawingNo(getString(data, "drawingNo"));
        item.setName(getString(data, "name"));
        item.setSpecification(getString(data, "specification"));
        item.setMaterial(getString(data, "material"));
        item.setSurfaceTreatment(getString(data, "surfaceTreatment"));
        // Frontend sends "unitOfMeasure"; accept both for backward compat
        String unit = getString(data, "unit");
        if (unit == null) unit = getString(data, "unitOfMeasure");
        item.setUnit(unit);
        item.setUnitPrice(getBigDecimal(data, "unitPrice"));
        item.setWeight(getBigDecimal(data, "weight"));
        item.setQuantity(getBigDecimal(data, "quantity"));
        item.setSourceType(getString(data, "sourceType"));
        item.setStorageLocation(getString(data, "storageLocation"));
        item.setRemark(getString(data, "remark"));

        // Compute tree metadata from parent
        Long parentId = item.getParentId();
        if (parentId != null) {
            BomItem parent = bomItemMapper.selectById(parentId);
            if (parent != null) {
                item.setLevel(parent.getLevel() + 1);
                item.setPath(parent.getPath() != null
                        ? parent.getPath() + "," + parent.getId()
                        : String.valueOf(parent.getId()));
                Integer seqNo = item.getSeqNo();
                item.setLevelNo(parent.getLevelNo() != null
                        ? parent.getLevelNo() + "." + seqNo
                        : String.valueOf(seqNo));
            } else {
                item.setLevel(1);
            }
        } else {
            item.setLevel(1);
        }

        bomItemMapper.insert(item);
        recalculateBomTotals(bomId);
    }

    private void applyUpdateItem(Map<String, Object> data) {
        Long itemId = getLong(data, "itemId");
        if (itemId == null) return;

        BomItem item = bomItemMapper.selectById(itemId);
        if (item == null) {
            log.warn("BomItem {} not found for update", itemId);
            return;
        }

        if (data.containsKey("name")) item.setName(getString(data, "name"));
        if (data.containsKey("materialCode")) item.setMaterialCode(getString(data, "materialCode"));
        if (data.containsKey("specification")) item.setSpecification(getString(data, "specification"));
        if (data.containsKey("quantity")) item.setQuantity(getBigDecimal(data, "quantity"));
        if (data.containsKey("unitPrice")) item.setUnitPrice(getBigDecimal(data, "unitPrice"));
        if (data.containsKey("weight")) item.setWeight(getBigDecimal(data, "weight"));
        if (data.containsKey("remark")) item.setRemark(getString(data, "remark"));

        bomItemMapper.updateById(item);
    }

    private void applyDeleteItem(Map<String, Object> data) {
        Long itemId = getLong(data, "itemId");
        if (itemId == null) return;

        // Cascade delete children first
        List<BomItem> children = bomItemMapper.selectList(
                new LambdaQueryWrapper<BomItem>().eq(BomItem::getParentId, itemId));
        for (BomItem child : children) {
            applyDeleteItem(Map.of("itemId", child.getId()));
        }

        bomItemMapper.deleteById(itemId);
    }

    private void recalculateBomTotals(Long bomId) {
        Bom bom = bomMapper.selectById(bomId);
        if (bom == null) return;
        Long count = bomItemMapper.selectCount(
                new LambdaQueryWrapper<BomItem>().eq(BomItem::getBomId, bomId));
        bom.setTotalItems(count != null ? count.intValue() : 0);

        List<BomItem> items = bomItemMapper.selectList(
                new LambdaQueryWrapper<BomItem>().eq(BomItem::getBomId, bomId));
        BigDecimal totalWeight = BigDecimal.ZERO;
        for (BomItem it : items) {
            if (it.getWeight() != null && it.getQuantity() != null) {
                totalWeight = totalWeight.add(it.getWeight().multiply(it.getQuantity()));
            }
        }
        bom.setTotalWeight(totalWeight);
        bomMapper.updateById(bom);
    }

    private String getString(Map<String, Object> data, String key) {
        Object v = data.get(key);
        return v != null ? v.toString() : null;
    }

    private Long getLong(Map<String, Object> data, String key) {
        Object v = data.get(key);
        if (v == null) return null;
        return v instanceof Number ? ((Number) v).longValue() : Long.parseLong(v.toString());
    }

    private Integer getInt(Map<String, Object> data, String key) {
        Object v = data.get(key);
        if (v == null) return null;
        return v instanceof Number ? ((Number) v).intValue() : Integer.parseInt(v.toString());
    }

    private BigDecimal getBigDecimal(Map<String, Object> data, String key) {
        Object v = data.get(key);
        if (v == null) return null;
        return new BigDecimal(v.toString());
    }
}
