package com.syncflow.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.admin.dto.PermissionVO;
import com.syncflow.admin.entity.Permission;
import com.syncflow.admin.entity.Role;
import com.syncflow.admin.entity.RolePermission;
import com.syncflow.admin.mapper.PermissionMapper;
import com.syncflow.admin.mapper.RoleMapper;
import com.syncflow.admin.mapper.RolePermissionMapper;
import com.syncflow.admin.service.impl.RoleServiceImpl;
import com.syncflow.common.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RoleService")
class RoleServiceTest {

    @Mock
    private RoleMapper roleMapper;

    @Mock
    private PermissionMapper permissionMapper;

    @Mock
    private RolePermissionMapper rolePermissionMapper;

    @InjectMocks
    private RoleServiceImpl roleService;

    private Role buildRole(Long id, String code, String name) {
        Role role = new Role();
        role.setId(id);
        role.setCode(code);
        role.setName(name);
        role.setDescription(name + " role");
        role.setTenantId(1L);
        return role;
    }

    private Permission buildPermission(Long id, String code, String name) {
        Permission perm = new Permission();
        perm.setId(id);
        perm.setCode(code);
        perm.setName(name);
        perm.setType("MENU");
        perm.setSortOrder(0);
        return perm;
    }

    // -----------------------------------------------------------------------
    //  getRoleById
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getRoleById()")
    class GetRoleById {

        @Test
        @DisplayName("should return role when exists")
        void shouldReturnRole() {
            Role role = buildRole(1L, "ADMIN", "Administrator");
            when(roleMapper.selectById(1L)).thenReturn(role);

            Role result = roleService.getRoleById(1L);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals("ADMIN", result.getCode());
            verify(roleMapper).selectById(1L);
        }

        @Test
        @DisplayName("should throw when role not found")
        void shouldThrowWhenRoleNotFound() {
            when(roleMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> roleService.getRoleById(999L));
            assertEquals("Role not found", ex.getMessage());
            verify(roleMapper).selectById(999L);
        }
    }

    // -----------------------------------------------------------------------
    //  getRolePage
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getRolePage()")
    class GetRolePage {

        @Test
        @DisplayName("should return paginated role list without keyword")
        void shouldReturnPaginatedRoles() {
            Page<Role> page = new Page<>(1, 10);
            page.setRecords(List.of(buildRole(1L, "ADMIN", "Administrator")));
            page.setTotal(1);

            when(roleMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                    .thenReturn(page);

            Page<Role> result = roleService.getRolePage(null, 1, 10);

            assertNotNull(result);
            assertEquals(1, result.getRecords().size());
            assertEquals(1L, result.getTotal());
            verify(roleMapper).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("should return empty page when no roles")
        void shouldReturnEmptyPage() {
            Page<Role> page = new Page<>(1, 10);
            page.setRecords(Collections.emptyList());
            page.setTotal(0);

            when(roleMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                    .thenReturn(page);

            Page<Role> result = roleService.getRolePage(null, 1, 10);

            assertNotNull(result);
            assertTrue(result.getRecords().isEmpty());
            assertEquals(0L, result.getTotal());
        }
    }

    // -----------------------------------------------------------------------
    //  getRolePermissions
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getRolePermissions()")
    class GetRolePermissions {

        @Test
        @DisplayName("should return permissions for a role")
        void shouldReturnPermissions() {
            Role role = buildRole(1L, "ADMIN", "Administrator");
            when(roleMapper.selectById(1L)).thenReturn(role);

            RolePermission rp1 = new RolePermission();
            rp1.setRoleId(1L);
            rp1.setPermissionId(1L);
            RolePermission rp2 = new RolePermission();
            rp2.setRoleId(1L);
            rp2.setPermissionId(2L);

            when(rolePermissionMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(rp1, rp2));

            Permission p1 = buildPermission(1L, "project:view", "View Projects");
            Permission p2 = buildPermission(2L, "project:create", "Create Projects");
            when(permissionMapper.selectBatchIds(anyList())).thenReturn(List.of(p1, p2));

            List<PermissionVO> result = roleService.getRolePermissions(1L);

            assertNotNull(result);
            assertEquals(2, result.size());
            assertEquals("project:view", result.get(0).getCode());
            assertEquals("project:create", result.get(1).getCode());
            verify(roleMapper).selectById(1L);
            verify(rolePermissionMapper).selectList(any(LambdaQueryWrapper.class));
            verify(permissionMapper).selectBatchIds(anyList());
        }

        @Test
        @DisplayName("should return empty list when role has no permissions")
        void shouldReturnEmptyList() {
            Role role = buildRole(1L, "USER", "Normal User");
            when(roleMapper.selectById(1L)).thenReturn(role);

            when(rolePermissionMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of());

            List<PermissionVO> result = roleService.getRolePermissions(1L);

            assertNotNull(result);
            assertTrue(result.isEmpty());
            verify(permissionMapper, never()).selectBatchIds(anyList());
        }

        @Test
        @DisplayName("should throw when role not found")
        void shouldThrowWhenRoleNotFound() {
            when(roleMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> roleService.getRolePermissions(999L));
            assertEquals("Role not found", ex.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    //  assignPermissions
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("assignPermissions()")
    class AssignPermissions {

        @Test
        @DisplayName("should assign permissions to role")
        void shouldAssignPermissions() {
            Role role = buildRole(1L, "ADMIN", "Administrator");
            when(roleMapper.selectById(1L)).thenReturn(role);

            when(rolePermissionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(2);
            when(rolePermissionMapper.insert(any(RolePermission.class))).thenReturn(1);

            roleService.assignPermissions(1L, List.of(1L, 2L, 3L));

            verify(roleMapper).selectById(1L);
            verify(rolePermissionMapper).delete(any(LambdaQueryWrapper.class));
            verify(rolePermissionMapper, times(3)).insert(any(RolePermission.class));
        }

        @Test
        @DisplayName("should throw when role not found")
        void shouldThrowWhenRoleNotFound() {
            when(roleMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> roleService.assignPermissions(999L, List.of(1L)));
            assertEquals("Role not found", ex.getMessage());
        }

        @Test
        @DisplayName("should delete all existing and assign nothing when empty list")
        void shouldClearPermissions() {
            Role role = buildRole(1L, "ADMIN", "Administrator");
            when(roleMapper.selectById(1L)).thenReturn(role);

            when(rolePermissionMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(3);

            roleService.assignPermissions(1L, List.of());

            verify(rolePermissionMapper).delete(any(LambdaQueryWrapper.class));
            verify(rolePermissionMapper, never()).insert(any(RolePermission.class));
        }
    }
}
