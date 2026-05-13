package com.syncflow.admin.controller.sys;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.admin.dto.LoginDTO;
import com.syncflow.admin.dto.LoginVO;
import com.syncflow.admin.dto.UserVO;
import com.syncflow.admin.filter.JwtAuthenticationFilter;
import com.syncflow.admin.service.AuthService;
import com.syncflow.admin.service.UserService;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.common.util.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("AuthController")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private MockedStatic<SecurityUtils> securityUtilsMock;

    @BeforeEach
    void setUp() {
        securityUtilsMock = Mockito.mockStatic(SecurityUtils.class, Mockito.CALLS_REAL_METHODS);
    }

    @AfterEach
    void tearDown() {
        securityUtilsMock.close();
    }

    // -----------------------------------------------------------------------
    //  Helper
    // -----------------------------------------------------------------------

    private LoginVO buildLoginVO() {
        LoginVO vo = new LoginVO();
        vo.setToken("access-token-123");
        vo.setRefreshToken("refresh-token-456");
        vo.setUserId(1L);
        vo.setUsername("admin");
        vo.setRealName("Admin User");
        vo.setRoles(List.of("ADMIN"));
        return vo;
    }

    private UserVO buildUserVO() {
        UserVO vo = new UserVO();
        vo.setId(1L);
        vo.setUsername("admin");
        vo.setRealName("Admin User");
        vo.setStatus(1);
        vo.setDeptName("Engineering");
        vo.setRoles(List.of("ADMIN"));
        return vo;
    }

    // -----------------------------------------------------------------------
    //  POST /api/auth/login
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/auth/login")
    class LoginTests {

        @Test
        @DisplayName("should return tokens on successful login")
        void login_success() throws Exception {
            LoginDTO dto = new LoginDTO();
            dto.setUsername("admin");
            dto.setPassword("123456");

            LoginVO expected = buildLoginVO();
            when(authService.login(any(LoginDTO.class))).thenReturn(expected);

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.token").value("access-token-123"))
                    .andExpect(jsonPath("$.data.refreshToken").value("refresh-token-456"))
                    .andExpect(jsonPath("$.data.userId").value(1))
                    .andExpect(jsonPath("$.data.username").value("admin"))
                    .andExpect(jsonPath("$.data.roles[0]").value("ADMIN"));

            verify(authService).login(any(LoginDTO.class));
        }

        @Test
        @DisplayName("should return error when credentials are wrong")
        void login_wrongCredentials() throws Exception {
            LoginDTO dto = new LoginDTO();
            dto.setUsername("admin");
            dto.setPassword("wrong");

            when(authService.login(any(LoginDTO.class)))
                    .thenThrow(new BusinessException(ErrorCode.AUTH_LOGIN_FAILED));

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.AUTH_LOGIN_FAILED.getCode()))
                    .andExpect(jsonPath("$.data").doesNotExist());
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/auth/refresh
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/auth/refresh")
    class RefreshTokenTests {

        @Test
        @DisplayName("should return new tokens on valid refresh")
        void refreshToken_success() throws Exception {
            LoginVO expected = buildLoginVO();
            when(authService.refreshToken("valid-refresh-token")).thenReturn(expected);

            mockMvc.perform(post("/api/auth/refresh")
                            .param("refreshToken", "valid-refresh-token"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.token").value("access-token-123"))
                    .andExpect(jsonPath("$.data.refreshToken").value("refresh-token-456"));

            verify(authService).refreshToken("valid-refresh-token");
        }

        @Test
        @DisplayName("should return error when refresh token is invalid")
        void refreshToken_invalidToken() throws Exception {
            when(authService.refreshToken("expired-token"))
                    .thenThrow(new BusinessException(ErrorCode.TOKEN_INVALID));

            mockMvc.perform(post("/api/auth/refresh")
                            .param("refreshToken", "expired-token"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.TOKEN_INVALID.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/auth/logout
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/auth/logout")
    class LogoutTests {

        @Test
        @DisplayName("should clear security context and return success")
        void logout_success() throws Exception {
            // SecurityUtils.clear() is safe to call - it just removes ThreadLocal values

            mockMvc.perform(post("/api/auth/logout"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/auth/me
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/auth/me")
    class GetCurrentUserTests {

        @Test
        @DisplayName("should return current user info")
        void getCurrentUser_success() throws Exception {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(1L);

            UserVO expected = buildUserVO();
            when(userService.getUserById(1L)).thenReturn(expected);

            mockMvc.perform(get("/api/auth/me"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.username").value("admin"))
                    .andExpect(jsonPath("$.data.realName").value("Admin User"))
                    .andExpect(jsonPath("$.data.deptName").value("Engineering"));

            verify(userService).getUserById(1L);
        }

        @Test
        @DisplayName("should return error when user not found")
        void getCurrentUser_userNotFound() throws Exception {
            securityUtilsMock.when(SecurityUtils::getCurrentUserId).thenReturn(99L);
            when(userService.getUserById(99L))
                    .thenThrow(new BusinessException(ErrorCode.USER_NOT_FOUND));

            mockMvc.perform(get("/api/auth/me"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.USER_NOT_FOUND.getCode()));
        }
    }
}
