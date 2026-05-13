package com.syncflow.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.admin.dto.LoginDTO;
import com.syncflow.admin.dto.LoginVO;
import com.syncflow.admin.entity.User;
import com.syncflow.admin.entity.UserRole;
import com.syncflow.admin.mapper.RoleMapper;
import com.syncflow.admin.mapper.UserMapper;
import com.syncflow.admin.mapper.UserRoleMapper;
import com.syncflow.admin.service.impl.AuthServiceImpl;
import com.syncflow.common.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.lang.reflect.Field;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService")
class AuthServiceTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private RoleMapper roleMapper;

    @Mock
    private UserRoleMapper userRoleMapper;

    @InjectMocks
    private AuthServiceImpl authService;

    // Use a real BCryptPasswordEncoder (not mockable on Java 21+)
    private final BCryptPasswordEncoder realEncoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() throws Exception {
        // Inject real encoder into the service (service creates its own internally)
        Field encoderField = AuthServiceImpl.class.getDeclaredField("passwordEncoder");
        encoderField.setAccessible(true);
        encoderField.set(authService, realEncoder);

        // Set @Value fields via reflection
        setField("jwtSecret", "SyncFlowDefaultSecretKey2024!@#$%^&*()_+AbCdEfGhIjKl");
        setField("jwtExpiration", 86400000L);
        setField("refreshExpiration", 604800000L);
    }

    private void setField(String fieldName, Object value) throws Exception {
        Field field = AuthServiceImpl.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(authService, value);
    }

    private User buildUser(Long id, String username, String plainPassword) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setPassword(realEncoder.encode(plainPassword));
        user.setRealName("Test User");
        user.setAvatar("avatar.png");
        user.setStatus(1);
        return user;
    }

    private LoginDTO buildLoginDTO(String username, String password) {
        LoginDTO dto = new LoginDTO();
        dto.setUsername(username);
        dto.setPassword(password);
        return dto;
    }

    // -----------------------------------------------------------------------
    //  login
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("login()")
    class Login {

        @Test
        @DisplayName("should return LoginVO on valid credentials")
        void shouldReturnLoginVOOnValidCredentials() {
            User user = buildUser(1L, "admin", "rawPw");
            LoginDTO dto = buildLoginDTO("admin", "rawPw");

            when(userMapper.selectByUsername("admin")).thenReturn(user);
            when(userRoleMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of());

            LoginVO result = authService.login(dto);

            assertNotNull(result);
            assertNotNull(result.getToken());
            assertNotNull(result.getRefreshToken());
            assertEquals(1L, result.getUserId());
            assertEquals("admin", result.getUsername());
            assertEquals("Test User", result.getRealName());

            verify(userMapper).selectByUsername("admin");
            verify(userMapper).updateById(user); // last login time updated
        }

        @Test
        @DisplayName("should throw when user not found")
        void shouldThrowWhenUserNotFound() {
            LoginDTO dto = buildLoginDTO("unknown", "rawPw");
            when(userMapper.selectByUsername("unknown")).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> authService.login(dto));
            assertEquals("Username or password is incorrect", ex.getMessage());

            verify(userMapper).selectByUsername("unknown");
        }

        @Test
        @DisplayName("should throw when user is disabled")
        void shouldThrowWhenUserDisabled() {
            User user = buildUser(1L, "admin", "rawPw");
            user.setStatus(0); // disabled
            LoginDTO dto = buildLoginDTO("admin", "rawPw");

            when(userMapper.selectByUsername("admin")).thenReturn(user);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> authService.login(dto));
            assertEquals("User account is disabled", ex.getMessage());
        }

        @Test
        @DisplayName("should throw on invalid password")
        void shouldThrowOnInvalidPassword() {
            User user = buildUser(1L, "admin", "correctPw");
            LoginDTO dto = buildLoginDTO("admin", "wrongPw");

            when(userMapper.selectByUsername("admin")).thenReturn(user);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> authService.login(dto));
            assertEquals("Username or password is incorrect", ex.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    //  refreshToken
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("refreshToken()")
    class RefreshToken {

        @Test
        @DisplayName("should return new LoginVO on valid refresh token")
        void shouldReturnNewLoginVOOnValidRefreshToken() throws Exception {
            // Generate a valid token using the service's own generateToken method
            String refreshToken = authService.generateToken(1L, "admin", 1L, 604800000L);

            User user = buildUser(1L, "admin", "any");
            when(userMapper.selectById(1L)).thenReturn(user);
            when(userRoleMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of());

            LoginVO result = authService.refreshToken(refreshToken);

            assertNotNull(result);
            assertNotNull(result.getToken());
            assertNotNull(result.getRefreshToken());
            assertEquals(1L, result.getUserId());
            assertEquals("admin", result.getUsername());
        }

        @Test
        @DisplayName("should throw on invalid token")
        void shouldThrowOnInvalidToken() {
            BusinessException ex = assertThrows(BusinessException.class,
                    () -> authService.refreshToken("invalid.token.here"));
            assertEquals("Token is invalid", ex.getMessage());
        }
    }
}
