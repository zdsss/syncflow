package com.syncflow.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.admin.dto.LoginDTO;
import com.syncflow.admin.dto.LoginVO;
import com.syncflow.admin.dto.RegisterDTO;
import com.syncflow.admin.dto.UpdateProfileDTO;
import com.syncflow.admin.entity.User;
import com.syncflow.admin.entity.UserRole;
import com.syncflow.admin.entity.Role;
import com.syncflow.admin.mapper.UserMapper;
import com.syncflow.admin.mapper.RoleMapper;
import com.syncflow.admin.service.AuthService;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.util.SecurityUtils;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import com.syncflow.admin.mapper.UserRoleMapper;

/**
 * Authentication service implementation
 */
@Service
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final RoleMapper roleMapper;
    private final UserRoleMapper userRoleMapper;
    private final BCryptPasswordEncoder passwordEncoder;

    @Value("${jwt.secret:SyncFlowDefaultSecretKey2024!@#$%^&*()_+AbCdEfGhIjKl}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    @Value("${jwt.refresh-expiration:604800000}")
    private long refreshExpiration;

    public AuthServiceImpl(UserMapper userMapper,
                           RoleMapper roleMapper,
                           UserRoleMapper userRoleMapper) {
        this.userMapper = userMapper;
        this.roleMapper = roleMapper;
        this.userRoleMapper = userRoleMapper;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    public LoginVO login(LoginDTO dto) {
        // Find user by username
        User user = userMapper.selectByUsername(dto.getUsername());
        if (user == null) {
            throw new BusinessException(ErrorCode.USERNAME_OR_PASSWORD_ERROR);
        }

        // Check user status
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BusinessException(ErrorCode.USER_DISABLED);
        }

        // Verify password
        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            throw new BusinessException(ErrorCode.USERNAME_OR_PASSWORD_ERROR);
        }

        // Generate tokens
        Long tenantId = user.getTenantId();
        String token = generateToken(user.getId(), user.getUsername(), tenantId, jwtExpiration);
        String refreshToken = generateToken(user.getId(), user.getUsername(), tenantId, refreshExpiration);

        // Update last login time
        user.setLastLoginAt(LocalDateTime.now());
        userMapper.updateById(user);

        // Store current user ID in SecurityUtils ThreadLocal
        SecurityUtils.setCurrentUserId(user.getId());

        // Build response
        LoginVO vo = new LoginVO();
        vo.setToken(token);
        vo.setRefreshToken(refreshToken);
        vo.setUserId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setRealName(user.getRealName());
        vo.setAvatar(user.getAvatar());
        vo.setRoles(getUserRoles(user.getId()));
        return vo;
    }

    @Override
    public LoginVO refreshToken(String refreshToken) {
        try {
            Claims claims = parseToken(refreshToken);
            Long userId = claims.get("userId", Long.class);
            String username = claims.getSubject();
            Long tenantId = claims.get("tenantId", Long.class);

            // Verify user still exists
            User user = userMapper.selectById(userId);
            if (user == null || (user.getDeletedAt() != null)) {
                throw new BusinessException(ErrorCode.TOKEN_INVALID);
            }

            // Generate new tokens (use tenantId from user record if not in claims)
            Long resolvedTenantId = tenantId != null ? tenantId : user.getTenantId();
            String newToken = generateToken(userId, username, resolvedTenantId, jwtExpiration);
            String newRefreshToken = generateToken(userId, username, resolvedTenantId, refreshExpiration);

            LoginVO vo = new LoginVO();
            vo.setToken(newToken);
            vo.setRefreshToken(newRefreshToken);
            vo.setUserId(user.getId());
            vo.setUsername(user.getUsername());
            vo.setRealName(user.getRealName());
            vo.setAvatar(user.getAvatar());
            vo.setRoles(getUserRoles(user.getId()));
            return vo;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }
    }

    /**
     * Generate JWT token with userId, username, and tenantId claims
     */
    public String generateToken(Long userId, String username, Long tenantId, long expiration) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        Date now = new Date();
        var builder = Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiration))
                .signWith(key);
        if (tenantId != null) {
            builder.claim("tenantId", tenantId);
        }
        return builder.compact();
    }

    /**
     * Parse and validate JWT token
     */
    public Claims parseToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Get role codes for a user
     */
    private List<String> getUserRoles(Long userId) {
        LambdaQueryWrapper<UserRole> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserRole::getUserId, userId);
        List<UserRole> userRoles = userRoleMapper.selectList(wrapper);

        if (userRoles.isEmpty()) {
            return List.of();
        }

        List<Long> roleIds = userRoles.stream()
                .map(UserRole::getRoleId)
                .collect(Collectors.toList());

        List<Role> roles = roleMapper.selectBatchIds(roleIds);
        return roles.stream()
                .map(Role::getCode)
                .collect(Collectors.toList());
    }

    @Override
    public LoginVO register(RegisterDTO dto) {
        // Check username uniqueness
        User existing = userMapper.selectByUsername(dto.getUsername());
        if (existing != null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "Username already exists");
        }

        // Create user
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRealName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setStatus(1);
        userMapper.insert(user);

        // Generate tokens and return
        String token = generateToken(user.getId(), user.getUsername(), user.getTenantId(), jwtExpiration);
        String refreshToken = generateToken(user.getId(), user.getUsername(), user.getTenantId(), refreshExpiration);

        LoginVO vo = new LoginVO();
        vo.setToken(token);
        vo.setRefreshToken(refreshToken);
        vo.setUserId(user.getId());
        vo.setUsername(user.getUsername());
        vo.setRealName(user.getRealName());
        vo.setAvatar(null);
        vo.setRoles(List.of());
        return vo;
    }

    @Override
    public void forgotPassword(String email) {
        if (email == null || email.isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "Email is required");
        }
        // In production, this would send a reset email with a token.
        // For now, verify the email exists.
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getEmail, email).isNull(User::getDeletedAt);
        User user = userMapper.selectOne(wrapper);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        // TODO: Send email with reset token (requires email service integration)
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        if (token == null || newPassword == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "Token and password are required");
        }
        // Validate the reset token (reuse JWT parsing)
        try {
            Claims claims = parseToken(token);
            Long userId = claims.get("userId", Long.class);
            User user = userMapper.selectById(userId);
            if (user == null) {
                throw new BusinessException(ErrorCode.USER_NOT_FOUND);
            }
            user.setPassword(passwordEncoder.encode(newPassword));
            userMapper.updateById(user);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }
    }

    @Override
    public void updateProfile(Long userId, UpdateProfileDTO dto) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        if (dto.getRealName() != null) user.setRealName(dto.getRealName());
        if (dto.getPhone() != null) user.setPhone(dto.getPhone());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        if (dto.getAvatar() != null) user.setAvatar(dto.getAvatar());
        userMapper.updateById(user);
    }

    @Override
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        if (oldPassword == null || newPassword == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "Old and new passwords are required");
        }
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ErrorCode.USER_NOT_FOUND);
        }
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BusinessException(ErrorCode.USERNAME_OR_PASSWORD_ERROR, "Old password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userMapper.updateById(user);
    }
}
