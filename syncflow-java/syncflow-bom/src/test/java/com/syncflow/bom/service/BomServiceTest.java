package com.syncflow.bom.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.admin.entity.User;
import com.syncflow.admin.mapper.UserMapper;
import com.syncflow.bom.dto.*;
import com.syncflow.bom.entity.Bom;
import com.syncflow.bom.entity.BomItem;
import com.syncflow.bom.entity.BomVersion;
import com.syncflow.bom.mapper.BomItemMapper;
import com.syncflow.bom.mapper.BomMapper;
import com.syncflow.bom.mapper.BomVersionMapper;
import com.syncflow.bom.service.impl.BomServiceImpl;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.project.entity.Project;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.workflow.service.WorkflowService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BomService")
class BomServiceTest {

    @Mock
    private BomMapper bomMapper;

    @Mock
    private BomItemMapper bomItemMapper;

    @Mock
    private BomVersionMapper bomVersionMapper;

    @Mock
    private UserMapper userMapper;

    @Mock
    private ProjectMapper projectMapper;

    @Mock
    private WorkflowService workflowService;

    @InjectMocks
    private BomServiceImpl bomService;

    private Bom buildBom(Long id, String name) {
        Bom bom = new Bom();
        bom.setId(id);
        bom.setBomNo("BOM-20260507-" + String.format("%03d", id));
        bom.setName(name);
        bom.setVersion("1.0");
        bom.setProjectId(1L);
        bom.setStatus(1); // EDITING
        bom.setIsLatest(true);
        bom.setTotalItems(0);
        bom.setTenantId(1L);
        bom.setCreatedBy(1L);
        return bom;
    }

    private BomItem buildBomItem(Long id, Long bomId, Long parentId) {
        BomItem item = new BomItem();
        item.setId(id);
        item.setBomId(bomId);
        item.setParentId(parentId);
        item.setLevel(1);
        item.setSeqNo(10);
        item.setName("Item " + id);
        item.setMaterialCode("MAT-" + id);
        item.setSourceType("MADE");
        item.setQuantity(BigDecimal.ONE);
        return item;
    }

    // -----------------------------------------------------------------------
    //  listBoms
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("listBoms()")
    class ListBoms {

        @Test
        @DisplayName("should return list of BOMs")
        void shouldReturnListOfBoms() {
            Bom bom = buildBom(1L, "BOM 1");
            when(bomMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(bom));
            User user = new User();
            user.setId(1L);
            user.setRealName("Creator");
            when(userMapper.selectById(anyLong())).thenReturn(user);
            Project project = new Project();
            project.setId(1L);
            project.setName("Project 1");
            when(projectMapper.selectById(1L)).thenReturn(project);

            List<BomVO> result = bomService.listBoms(1L);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("BOM 1", result.get(0).getName());
            assertEquals("BOM-20260507-001", result.get(0).getBomNo());
            verify(bomMapper).selectList(any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("should return empty list when no BOMs")
        void shouldReturnEmptyList() {
            when(bomMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());

            List<BomVO> result = bomService.listBoms(null);

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  getBomDetail
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getBomDetail()")
    class GetBomDetail {

        @Test
        @DisplayName("should return BomVO when BOM exists")
        void shouldReturnBomVO() {
            Bom bom = buildBom(1L, "BOM 1");
            when(bomMapper.selectById(1L)).thenReturn(bom);
            User user = new User();
            user.setId(1L);
            user.setRealName("Creator");
            when(userMapper.selectById(anyLong())).thenReturn(user);
            Project project = new Project();
            project.setId(1L);
            project.setName("Project 1");
            when(projectMapper.selectById(1L)).thenReturn(project);

            BomVO result = bomService.getBomDetail(1L);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals("BOM 1", result.getName());
            assertNotNull(result.getStatusName());
            verify(bomMapper).selectById(1L);
        }

        @Test
        @DisplayName("should throw when BOM not found")
        void shouldThrowWhenBomNotFound() {
            when(bomMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> bomService.getBomDetail(999L));
            assertEquals("BOM not found", ex.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    //  createBom
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("createBom()")
    class CreateBom {

        @Test
        @DisplayName("should create BOM with initial version")
        void shouldCreateBom() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::getUserId).thenReturn(1L);

                CreateBomDTO dto = new CreateBomDTO();
                dto.setName("New BOM");
                dto.setProjectId(1L);
                dto.setProductCode("PROD-001");
                dto.setProductName("Product 1");

                // BOM number generation
                when(bomMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
                when(bomMapper.insert(any(Bom.class))).thenReturn(1);
                when(bomVersionMapper.insert(any(BomVersion.class))).thenReturn(1);

                User user = new User();
                user.setId(1L);
                user.setRealName("Creator");
                when(userMapper.selectById(anyLong())).thenReturn(user);
                Project project = new Project();
                project.setId(1L);
                project.setName("Project 1");
                when(projectMapper.selectById(1L)).thenReturn(project);

                BomVO result = bomService.createBom(dto);

                assertNotNull(result);
                assertEquals("New BOM", result.getName());
                verify(bomMapper).insert(any(Bom.class));
                verify(bomVersionMapper).insert(any(BomVersion.class));
            }
        }
    }

    // -----------------------------------------------------------------------
    //  getBomStructure
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getBomStructure()")
    class GetBomStructure {

        @Test
        @DisplayName("should return tree structure of BOM items")
        void shouldReturnBomStructure() {
            Bom bom = buildBom(1L, "BOM 1");
            when(bomMapper.selectById(1L)).thenReturn(bom);

            BomItem rootItem = buildBomItem(1L, 1L, null);
            rootItem.setLevel(1);
            BomItem childItem = buildBomItem(2L, 1L, 1L);
            childItem.setLevel(2);
            when(bomItemMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(rootItem, childItem));

            List<BomItemTreeVO> result = bomService.getBomStructure(1L);

            assertNotNull(result);
            assertEquals(1, result.size()); // one root
            assertEquals("Item 1", result.get(0).getName());
            assertNotNull(result.get(0).getChildren());
            assertEquals(1, result.get(0).getChildren().size());
            assertEquals("Item 2", result.get(0).getChildren().get(0).getName());
        }

        @Test
        @DisplayName("should throw when BOM not found")
        void shouldThrowWhenBomNotFound() {
            when(bomMapper.selectById(999L)).thenReturn(null);

            assertThrows(BusinessException.class, () -> bomService.getBomStructure(999L));
        }
    }

    // -----------------------------------------------------------------------
    //  addBomItem
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("addBomItem()")
    class AddBomItem {

        @Test
        @DisplayName("should add root-level item to BOM")
        void shouldAddRootLevelItem() {
            Bom bom = buildBom(1L, "BOM 1");
            when(bomMapper.selectById(1L)).thenReturn(bom);
            when(bomItemMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(bomItemMapper.insert(any(BomItem.class))).thenReturn(1);
            // Recalculate totals
            when(bomItemMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());
            when(bomMapper.updateById(any(Bom.class))).thenReturn(1);

            CreateBomItemDTO dto = new CreateBomItemDTO();
            dto.setName("Widget");
            dto.setMaterialCode("WDG-001");
            dto.setSourceType("MADE");

            BomItemTreeVO result = bomService.addBomItem(1L, dto);

            assertNotNull(result);
            assertEquals("Widget", result.getName());
            assertEquals(1, result.getLevel());
            verify(bomItemMapper).insert(any(BomItem.class));
        }
    }

    // -----------------------------------------------------------------------
    //  deleteBomItem
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("deleteBomItem()")
    class DeleteBomItem {

        @Test
        @DisplayName("should delete item from BOM")
        void shouldDeleteItem() {
            BomItem item = buildBomItem(1L, 1L, null);
            Bom bom = buildBom(1L, "BOM 1");
            when(bomItemMapper.selectById(1L)).thenReturn(item);
            when(bomMapper.selectById(1L)).thenReturn(bom);
            // deleteDescendants
            when(bomItemMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());
            when(bomItemMapper.deleteById(1L)).thenReturn(1);
            when(bomMapper.updateById(any(Bom.class))).thenReturn(1);

            bomService.deleteBomItem(1L);

            verify(bomItemMapper).deleteById(1L);
        }

        @Test
        @DisplayName("should throw when item not found")
        void shouldThrowWhenItemNotFound() {
            when(bomItemMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> bomService.deleteBomItem(999L));
            assertEquals("BOM子项不存在", ex.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    //  saveVersion
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("saveVersion()")
    class SaveVersion {

        @Test
        @DisplayName("should create new version of BOM")
        void shouldCreateNewVersion() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::getUserId).thenReturn(1L);

                Bom bom = buildBom(1L, "BOM 1");
                bom.setVersion("1.0");
                when(bomMapper.selectById(1L)).thenReturn(bom);
                when(bomMapper.updateById(any(Bom.class))).thenReturn(1);
                when(bomMapper.insert(any(Bom.class))).thenReturn(1);
                when(bomVersionMapper.insert(any(BomVersion.class))).thenReturn(1);
                // copyBomItems
                when(bomItemMapper.selectList(any(LambdaQueryWrapper.class)))
                        .thenReturn(Collections.emptyList());
                when(bomMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

                User user = new User();
                user.setId(1L);
                user.setRealName("Creator");
                when(userMapper.selectById(anyLong())).thenReturn(user);
                Project project = new Project();
                project.setId(1L);
                project.setName("Project 1");
                when(projectMapper.selectById(1L)).thenReturn(project);

                BomVO result = bomService.saveVersion(1L, "Updated material");

                assertNotNull(result);
                assertEquals("1.1", result.getVersion());
                assertEquals(true, result.getIsLatest()); // new version is latest
                verify(bomVersionMapper).insert(any(BomVersion.class));
            }
        }
    }

    // -----------------------------------------------------------------------
    //  getVersionHistory
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getVersionHistory()")
    class GetVersionHistory {

        @Test
        @DisplayName("should return version history list")
        void shouldReturnVersionHistory() {
            BomVersion version = new BomVersion();
            version.setId(1L);
            version.setBomId(1L);
            version.setVersion("1.0");
            version.setChangeSummary("Initial");
            version.setCreatedBy(1L);

            when(bomVersionMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(version));
            User user = new User();
            user.setId(1L);
            user.setRealName("Creator");
            when(userMapper.selectById(1L)).thenReturn(user);

            List<BomVersionVO> result = bomService.getVersionHistory(1L);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("1.0", result.get(0).getVersion());
            assertEquals("Creator", result.get(0).getCreatedByName());
        }
    }

    // -----------------------------------------------------------------------
    //  rollbackVersion
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("rollbackVersion()")
    class RollbackVersion {

        @Test
        @DisplayName("should restore BOM items from target version")
        void shouldRestoreItemsFromTargetVersion() {
            Bom currentBom = buildBom(2L, "BOM 1");
            currentBom.setVersion("1.1");
            currentBom.setParentBomId(1L);

            Bom rootBom = buildBom(1L, "BOM 1");
            rootBom.setVersion("1.0");
            rootBom.setParentBomId(null);

            BomVersion targetVersion = new BomVersion();
            targetVersion.setId(1L);
            targetVersion.setBomId(1L);
            targetVersion.setVersion("1.0");
            targetVersion.setSnapshotJson("[]");

            BomItem item = buildBomItem(10L, 1L, null);

            when(bomMapper.selectById(2L)).thenReturn(currentBom);
            when(bomMapper.selectById(1L)).thenReturn(rootBom);
            // collectVersionFamily BFS: children of root(1L)=[currentBom], children of 2L=[]
            when(bomMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(currentBom))
                    .thenReturn(Collections.emptyList());
            when(bomVersionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(targetVersion);
            when(bomItemMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            // copyBomItems: items from rootBom(1L)
            when(bomItemMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(List.of(item));
            when(bomItemMapper.insert(any(BomItem.class))).thenReturn(1);
            when(bomMapper.updateById(any(Bom.class))).thenReturn(1);

            bomService.rollbackVersion(2L, "1.0");

            verify(bomItemMapper).delete(any(LambdaQueryWrapper.class));
            verify(bomItemMapper).insert(any(BomItem.class));
            verify(bomMapper).updateById(any(Bom.class));
        }

        @Test
        @DisplayName("should throw when BOM not found")
        void shouldThrowWhenBomNotFound() {
            when(bomMapper.selectById(999L)).thenReturn(null);

            assertThrows(BusinessException.class,
                    () -> bomService.rollbackVersion(999L, "1.0"));
        }

        @Test
        @DisplayName("should throw when target version not found in family")
        void shouldThrowWhenVersionNotFound() {
            Bom bom = buildBom(1L, "BOM 1");
            when(bomMapper.selectById(1L)).thenReturn(bom);
            // collectVersionFamily: no parent, no children
            when(bomMapper.selectList(any(LambdaQueryWrapper.class))).thenReturn(Collections.emptyList());
            when(bomVersionMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

            assertThrows(BusinessException.class,
                    () -> bomService.rollbackVersion(1L, "9.9"));
        }
    }
}
