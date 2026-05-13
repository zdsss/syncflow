package com.syncflow.bom.service;

import com.syncflow.bom.dto.*;

import java.util.List;

/**
 * BOM management service interface.
 */
public interface BomService {

    /**
     * List all BOMs for the current tenant (paginated).
     */
    List<BomVO> listBoms(Long projectId);

    /**
     * Get BOM detail by id.
     */
    BomVO getBomDetail(Long id);

    /**
     * Create a new BOM.
     */
    BomVO createBom(CreateBomDTO dto);

    /**
     * Get the BOM item tree for a given BOM.
     */
    List<BomItemTreeVO> getBomStructure(Long bomId);

    /**
     * Add a BOM item to a BOM.
     */
    BomItemTreeVO addBomItem(Long bomId, CreateBomItemDTO dto);

    /**
     * Update a BOM item.
     */
    BomItemTreeVO updateBomItem(Long itemId, CreateBomItemDTO dto);

    /**
     * Delete a BOM item (and its children).
     */
    void deleteBomItem(Long itemId);

    /**
     * Submit a BOM for approval (status change + workflow trigger).
     */
    void submitForApproval(Long bomId);

    /**
     * Withdraw a pending BOM approval.
     */
    void withdrawApproval(Long bomId);

    /**
     * Save a new version snapshot of the BOM.
     */
    BomVO saveVersion(Long bomId, String changeSummary);

    /**
     * Get version history of a BOM.
     */
    List<BomVersionVO> getVersionHistory(Long bomId);

    /**
     * Compare two versions of a BOM and return item-level diffs.
     * <p>
     * {@code bomId} may be any BOM id in the version family (original or derived).
     * {@code v1} and {@code v2} are version strings such as "1.0" and "1.1".
     *
     * @throws com.syncflow.common.exception.BusinessException if the BOM is not found
     */
    BomVersionCompareVO compareVersions(Long bomId, String v1, String v2);

    /**
     * Roll back the BOM to a previously saved version.
     * <p>
     * Replaces the current items of {@code bomId} with items copied from the BOM
     * that owns the {@code targetVersion} record within the same version family.
     *
     * @throws com.syncflow.common.exception.BusinessException if the BOM or target version is not found
     */
    void rollbackVersion(Long bomId, String targetVersion);
}
