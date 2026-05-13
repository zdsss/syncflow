package com.syncflow.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.admin.dto.CreateUserDTO;
import com.syncflow.admin.dto.UserVO;
import com.syncflow.admin.entity.Department;
import com.syncflow.admin.entity.Role;
import com.syncflow.admin.entity.User;
import com.syncflow.admin.entity.UserRole;
import com.syncflow.admin.mapper.DepartmentMapper;
import com.syncflow.admin.mapper.RoleMapper;
import com.syncflow.admin.mapper.UserMapper;
import com.syncflow.admin.mapper.UserRoleMapper;
import com.syncflow.admin.service.UserService;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

/**
 * User service implementation
 */
@Service
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final DepartmentMapper departmentMapper;
    private final RoleMapper roleMapper;
    private final UserRoleMapper userRoleMapper;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserServiceImpl(UserMapper userMapper,
                           DepartmentMapper departmentMapper,
                           RoleMapper roleMapper,
                           UserRoleMapper userRoleMapper) {
        this.userMapper = userMapper;
        this.departmentMapper = departmentMapper;
        this.roleMapper = roleMapper;
        this.userRoleMapper = userRoleMapper;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    public Page<UserVO> getUserList(String keyword, int pageNum, int pageSize) {
        Page<User> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();

        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w
                    .like(User::getUsername, keyword)
                    .or().like(User::getRealName, keyword)
                    .or().like(User::getPhone, keyword)
            );
        }
        wrapper.orderByDesc(User::getCreatedAt);

        Page<User> userPage = userMapper.selectPage(page, wrapper);

        // Convert to VOs
        Page<UserVO> voPage = new Page<>(userPage.getCurrent(), userPage.getSize(), userPage.getTotal());
        List<UserVO> voList = userPage.getRecords().stream()
                .map(this::toUserVO)
                .collect(Collectors.toList());
        voPage.setRecords(voList);
        return voPage;
    }

    @Override
    public UserVO getUserById(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        return toUserVO(user);
    }

    @Override
    @Transactional
    public void createUser(CreateUserDTO dto) {
        // Check if username already exists
        User existing = userMapper.selectByUsername(dto.getUsername());
        if (existing != null) {
            throw new BusinessException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        // Create user
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRealName(dto.getRealName());
        user.setPhone(dto.getPhone());
        user.setEmail(dto.getEmail());
        user.setDeptId(dto.getDeptId());
        user.setStatus(1); // default active
        userMapper.insert(user);

        // Assign roles
        if (dto.getRoleIds() != null && !dto.getRoleIds().isEmpty()) {
            for (Long roleId : dto.getRoleIds()) {
                UserRole userRole = new UserRole();
                userRole.setUserId(user.getId());
                userRole.setRoleId(roleId);
                userRoleMapper.insert(userRole);
            }
        }
    }

    @Override
    @Transactional
    public void updateUser(Long id, CreateUserDTO dto) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        // Update basic fields
        if (StringUtils.hasText(dto.getRealName())) {
            user.setRealName(dto.getRealName());
        }
        if (StringUtils.hasText(dto.getPhone())) {
            user.setPhone(dto.getPhone());
        }
        if (StringUtils.hasText(dto.getEmail())) {
            user.setEmail(dto.getEmail());
        }
        if (dto.getDeptId() != null) {
            user.setDeptId(dto.getDeptId());
        }
        if (StringUtils.hasText(dto.getPassword())) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }
        userMapper.updateById(user);

        // Update roles if provided
        if (dto.getRoleIds() != null) {
            // Remove old roles
            LambdaQueryWrapper<UserRole> deleteWrapper = new LambdaQueryWrapper<>();
            deleteWrapper.eq(UserRole::getUserId, id);
            userRoleMapper.delete(deleteWrapper);

            // Add new roles
            for (Long roleId : dto.getRoleIds()) {
                UserRole userRole = new UserRole();
                userRole.setUserId(id);
                userRole.setRoleId(roleId);
                userRoleMapper.insert(userRole);
            }
        }
    }

    @Override
    public void deleteUser(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        userMapper.deleteById(id);
    }

    @Override
    public void changePassword(Long id, String oldPassword, String newPassword) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BusinessException(ErrorCode.OLD_PASSWORD_ERROR);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);
    }

    @Override
    public void updateUserStatus(Long id, Integer status) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }

        user.setStatus(status);
        userMapper.updateById(user);
    }

    /**
     * Convert User entity to UserVO, enriching with department name and roles
     */
    private UserVO toUserVO(User user) {
        UserVO vo = new UserVO();
        vo.setId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setRealName(user.getRealName());
        vo.setPhone(user.getPhone());
        vo.setEmail(user.getEmail());
        vo.setAvatar(user.getAvatar());
        vo.setStatus(user.getStatus());

        // Enrich department name
        if (user.getDeptId() != null) {
            Department dept = departmentMapper.selectById(user.getDeptId());
            if (dept != null) {
                vo.setDeptName(dept.getName());
            }
        }

        // Enrich roles
        LambdaQueryWrapper<UserRole> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserRole::getUserId, user.getId());
        List<UserRole> userRoles = userRoleMapper.selectList(wrapper);
        if (!userRoles.isEmpty()) {
            List<Long> roleIds = userRoles.stream()
                    .map(UserRole::getRoleId)
                    .collect(Collectors.toList());
            List<Role> roles = roleMapper.selectBatchIds(roleIds);
            vo.setRoles(roles.stream()
                    .map(Role::getName)
                    .collect(Collectors.toList()));
        } else {
            vo.setRoles(List.of());
        }

        return vo;
    }
}
