package com.syncflow.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.admin.dto.PermissionVO;
import com.syncflow.admin.entity.Permission;
import com.syncflow.admin.entity.Role;
import com.syncflow.admin.entity.RolePermission;
import com.syncflow.admin.mapper.PermissionMapper;
import com.syncflow.admin.mapper.RoleMapper;
import com.syncflow.admin.mapper.RolePermissionMapper;
import com.syncflow.admin.service.RoleService;
import com.syncflow.common.config.CacheConfig;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Role service implementation
 */
@Service
public class RoleServiceImpl implements RoleService {

    private final RoleMapper roleMapper;
    private final PermissionMapper permissionMapper;
    private final RolePermissionMapper rolePermissionMapper;

    public RoleServiceImpl(RoleMapper roleMapper,
                           PermissionMapper permissionMapper,
                           RolePermissionMapper rolePermissionMapper) {
        this.roleMapper = roleMapper;
        this.permissionMapper = permissionMapper;
        this.rolePermissionMapper = rolePermissionMapper;
    }

    @Override
    @Cacheable(CacheConfig.CACHE_ROLES_LIST)
    public List<Role> getRoleList() {
        return roleMapper.selectList(null);
    }

    @Override
    public Page<Role> getRolePage(String keyword, int pageNum, int pageSize) {
        Page<Role> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Role> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                    .like(Role::getCode, keyword)
                    .or().like(Role::getName, keyword)
            );
        }
        wrapper.orderByAsc(Role::getId);

        return roleMapper.selectPage(page, wrapper);
    }

    @Override
    public Role getRoleById(Long id) {
        Role role = roleMapper.selectById(id);
        if (role == null) {
            throw new BusinessException(ErrorCode.ROLE_NOT_FOUND);
        }
        return role;
    }

    @Override
    @CacheEvict(value = CacheConfig.CACHE_ROLES_LIST, allEntries = true)
    public void createRole(Role role) {
        // Validate unique code
        if (StringUtils.hasText(role.getCode())) {
            LambdaQueryWrapper<Role> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Role::getCode, role.getCode());
            Long count = roleMapper.selectCount(wrapper);
            if (count > 0) {
                throw new BusinessException(ErrorCode.PARAM_ERROR, "Role code already exists");
            }
        }
        roleMapper.insert(role);
    }

    @Override
    @CacheEvict(value = CacheConfig.CACHE_ROLES_LIST, allEntries = true)
    public void updateRole(Long id, Role role) {
        Role existing = roleMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.ROLE_NOT_FOUND);
        }

        // Validate unique code (excluding current)
        if (StringUtils.hasText(role.getCode())) {
            LambdaQueryWrapper<Role> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Role::getCode, role.getCode())
                    .ne(Role::getId, id);
            Long count = roleMapper.selectCount(wrapper);
            if (count > 0) {
                throw new BusinessException(ErrorCode.PARAM_ERROR, "Role code already exists");
            }
        }

        role.setId(id);
        roleMapper.updateById(role);
    }

    @Override
    @CacheEvict(value = CacheConfig.CACHE_ROLES_LIST, allEntries = true)
    public void deleteRole(Long id) {
        Role existing = roleMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.ROLE_NOT_FOUND);
        }
        roleMapper.deleteById(id);
    }

    @Override
    public List<PermissionVO> getRolePermissions(Long roleId) {
        Role role = roleMapper.selectById(roleId);
        if (role == null) {
            throw new BusinessException(ErrorCode.ROLE_NOT_FOUND);
        }

        LambdaQueryWrapper<RolePermission> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(RolePermission::getRoleId, roleId);
        List<RolePermission> rolePermissions = rolePermissionMapper.selectList(wrapper);

        if (rolePermissions.isEmpty()) {
            return List.of();
        }

        List<Long> permissionIds = rolePermissions.stream()
                .map(RolePermission::getPermissionId)
                .collect(Collectors.toList());

        List<Permission> permissions = permissionMapper.selectBatchIds(permissionIds);
        return permissions.stream()
                .map(this::toPermissionVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void assignPermissions(Long roleId, List<Long> permissionIds) {
        Role role = roleMapper.selectById(roleId);
        if (role == null) {
            throw new BusinessException(ErrorCode.ROLE_NOT_FOUND);
        }

        // Remove existing permissions
        LambdaQueryWrapper<RolePermission> deleteWrapper = new LambdaQueryWrapper<>();
        deleteWrapper.eq(RolePermission::getRoleId, roleId);
        rolePermissionMapper.delete(deleteWrapper);

        // Assign new permissions
        for (Long permissionId : permissionIds) {
            RolePermission rp = new RolePermission();
            rp.setRoleId(roleId);
            rp.setPermissionId(permissionId);
            rolePermissionMapper.insert(rp);
        }
    }

    private PermissionVO toPermissionVO(Permission permission) {
        PermissionVO vo = new PermissionVO();
        vo.setId(permission.getId());
        vo.setCode(permission.getCode());
        vo.setName(permission.getName());
        vo.setType(permission.getType());
        vo.setParentId(permission.getParentId());
        vo.setPath(permission.getPath());
        vo.setIcon(permission.getIcon());
        vo.setSortOrder(permission.getSortOrder());
        return vo;
    }
}
