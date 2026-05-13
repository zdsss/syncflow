package com.syncflow.admin.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.admin.dto.PermissionVO;
import com.syncflow.admin.entity.Role;

import java.util.List;

/**
 * Role service interface
 */
public interface RoleService {

    List<Role> getRoleList();

    /**
     * Get paginated role list with optional keyword search
     */
    Page<Role> getRolePage(String keyword, int pageNum, int pageSize);

    /**
     * Get role by ID
     */
    Role getRoleById(Long id);

    void createRole(Role role);

    void updateRole(Long id, Role role);

    void deleteRole(Long id);

    /**
     * Get permissions assigned to a role
     */
    List<PermissionVO> getRolePermissions(Long roleId);

    /**
     * Assign permissions to a role (replaces existing)
     */
    void assignPermissions(Long roleId, List<Long> permissionIds);
}
