package com.syncflow.admin.controller.sys;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.admin.dto.PermissionAssignDTO;
import com.syncflow.admin.dto.PermissionVO;
import com.syncflow.admin.entity.Role;
import com.syncflow.admin.service.RoleService;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.result.Result;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Role management controller
 */
@RestController
@RequestMapping("/api/sys/roles")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    /**
     * Get paginated role list with optional keyword search
     */
    @GetMapping
    public Result<PageResult<Role>> getRoleList(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        Page<Role> page = roleService.getRolePage(keyword, pageNum, pageSize);
        PageResult<Role> pageResult = PageResult.of(page);
        return Result.success(pageResult);
    }

    /**
     * Get role by ID
     */
    @GetMapping("/{id}")
    public Result<Role> getRoleById(@PathVariable Long id) {
        Role role = roleService.getRoleById(id);
        return Result.success(role);
    }

    /**
     * Create a new role
     */
    @PostMapping
    public Result<Void> createRole(@RequestBody Role role) {
        roleService.createRole(role);
        return Result.success();
    }

    /**
     * Update an existing role
     */
    @PutMapping("/{id}")
    public Result<Void> updateRole(@PathVariable Long id,
                                   @RequestBody Role role) {
        roleService.updateRole(id, role);
        return Result.success();
    }

    /**
     * Delete a role
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return Result.success();
    }

    /**
     * Get permissions for a role
     */
    @GetMapping("/{roleId}/permissions")
    public Result<List<PermissionVO>> getRolePermissions(@PathVariable Long roleId) {
        List<PermissionVO> permissions = roleService.getRolePermissions(roleId);
        return Result.success(permissions);
    }

    /**
     * Assign permissions to a role
     */
    @PutMapping("/{roleId}/permissions")
    public Result<Void> assignRolePermissions(@PathVariable Long roleId,
                                              @Valid @RequestBody PermissionAssignDTO dto) {
        roleService.assignPermissions(roleId, dto.getPermissionIds());
        return Result.success();
    }
}
