package com.syncflow.admin.controller.sys;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.admin.dto.ChangePasswordDTO;
import com.syncflow.admin.dto.CreateUserDTO;
import com.syncflow.admin.dto.UpdateUserStatusDTO;
import com.syncflow.admin.dto.UserVO;
import com.syncflow.admin.filter.JwtAuthenticationFilter;
import com.syncflow.admin.service.UserService;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("UserController")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private UserVO buildUserVO(Long id) {
        UserVO vo = new UserVO();
        vo.setId(id);
        vo.setUsername("user" + id);
        vo.setRealName("User " + id);
        vo.setPhone("1380000000" + id);
        vo.setEmail("user" + id + "@example.com");
        vo.setStatus(1);
        vo.setDeptName("Engineering");
        vo.setRoles(List.of("USER"));
        return vo;
    }

    private CreateUserDTO buildCreateUserDTO() {
        CreateUserDTO dto = new CreateUserDTO();
        dto.setUsername("newuser");
        dto.setPassword("123456");
        dto.setRealName("New User");
        dto.setEmail("newuser@example.com");
        dto.setDeptId(1L);
        dto.setRoleIds(List.of(1L));
        return dto;
    }

    // -----------------------------------------------------------------------
    //  GET /api/sys/users
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/sys/users")
    class GetUserListTests {

        @Test
        @DisplayName("should return paginated user list")
        void getUserList_success() throws Exception {
            Page<UserVO> page = new Page<>(1, 10);
            page.setTotal(2);
            page.setRecords(List.of(buildUserVO(1L), buildUserVO(2L)));

            when(userService.getUserList(null, 1, 10)).thenReturn(page);

            mockMvc.perform(get("/api/sys/users")
                            .param("pageNum", "1")
                            .param("pageSize", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.records").isArray())
                    .andExpect(jsonPath("$.data.records.length()").value(2))
                    .andExpect(jsonPath("$.data.total").value(2))
                    .andExpect(jsonPath("$.data.current").value(1))
                    .andExpect(jsonPath("$.data.size").value(10))
                    .andExpect(jsonPath("$.data.records[0].username").value("user1"));

            verify(userService).getUserList(null, 1, 10);
        }

        @Test
        @DisplayName("should filter by keyword")
        void getUserList_withKeyword() throws Exception {
            Page<UserVO> page = new Page<>(1, 10);
            page.setTotal(1);
            page.setRecords(List.of(buildUserVO(1L)));

            when(userService.getUserList("admin", 1, 10)).thenReturn(page);

            mockMvc.perform(get("/api/sys/users")
                            .param("keyword", "admin")
                            .param("pageNum", "1")
                            .param("pageSize", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.records.length()").value(1));

            verify(userService).getUserList("admin", 1, 10);
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/sys/users/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/sys/users/{id}")
    class GetUserByIdTests {

        @Test
        @DisplayName("should return user detail by ID")
        void getUserById_success() throws Exception {
            when(userService.getUserById(1L)).thenReturn(buildUserVO(1L));

            mockMvc.perform(get("/api/sys/users/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.username").value("user1"))
                    .andExpect(jsonPath("$.data.realName").value("User 1"));

            verify(userService).getUserById(1L);
        }

        @Test
        @DisplayName("should return error when user not found")
        void getUserById_notFound() throws Exception {
            when(userService.getUserById(99L))
                    .thenThrow(new BusinessException(ErrorCode.USER_NOT_FOUND));

            mockMvc.perform(get("/api/sys/users/99"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.USER_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/sys/users
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/sys/users")
    class CreateUserTests {

        @Test
        @DisplayName("should create user successfully")
        void createUser_success() throws Exception {
            CreateUserDTO dto = buildCreateUserDTO();
            doNothing().when(userService).createUser(any(CreateUserDTO.class));

            mockMvc.perform(post("/api/sys/users")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(userService).createUser(any(CreateUserDTO.class));
        }

        @Test
        @DisplayName("should return error when username already exists")
        void createUser_duplicateUsername() throws Exception {
            CreateUserDTO dto = buildCreateUserDTO();
            doThrow(new BusinessException(ErrorCode.USERNAME_ALREADY_EXISTS))
                    .when(userService).createUser(any(CreateUserDTO.class));

            mockMvc.perform(post("/api/sys/users")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.USERNAME_ALREADY_EXISTS.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/sys/users/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/sys/users/{id}")
    class UpdateUserTests {

        @Test
        @DisplayName("should update user successfully")
        void updateUser_success() throws Exception {
            CreateUserDTO dto = buildCreateUserDTO();
            doNothing().when(userService).updateUser(eq(1L), any(CreateUserDTO.class));

            mockMvc.perform(put("/api/sys/users/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(userService).updateUser(eq(1L), any(CreateUserDTO.class));
        }

        @Test
        @DisplayName("should return error when user not found")
        void updateUser_notFound() throws Exception {
            CreateUserDTO dto = buildCreateUserDTO();
            doThrow(new BusinessException(ErrorCode.USER_NOT_FOUND))
                    .when(userService).updateUser(eq(99L), any(CreateUserDTO.class));

            mockMvc.perform(put("/api/sys/users/99")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.USER_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  DELETE /api/sys/users/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/sys/users/{id}")
    class DeleteUserTests {

        @Test
        @DisplayName("should delete user successfully")
        void deleteUser_success() throws Exception {
            doNothing().when(userService).deleteUser(1L);

            mockMvc.perform(delete("/api/sys/users/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(userService).deleteUser(1L);
        }

        @Test
        @DisplayName("should return error when user not found")
        void deleteUser_notFound() throws Exception {
            doThrow(new BusinessException(ErrorCode.USER_NOT_FOUND))
                    .when(userService).deleteUser(99L);

            mockMvc.perform(delete("/api/sys/users/99"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.USER_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/sys/users/{id}/password
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/sys/users/{id}/password")
    class ChangePasswordTests {

        @Test
        @DisplayName("should change password successfully")
        void changePassword_success() throws Exception {
            ChangePasswordDTO dto = new ChangePasswordDTO();
            dto.setOldPassword("oldPass123");
            dto.setNewPassword("newPass456");

            doNothing().when(userService).changePassword(eq(1L), eq("oldPass123"), eq("newPass456"));

            mockMvc.perform(put("/api/sys/users/1/password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(userService).changePassword(eq(1L), eq("oldPass123"), eq("newPass456"));
        }

        @Test
        @DisplayName("should return error when old password is wrong")
        void changePassword_wrongOldPassword() throws Exception {
            ChangePasswordDTO dto = new ChangePasswordDTO();
            dto.setOldPassword("wrongOld");
            dto.setNewPassword("newPass456");

            doThrow(new BusinessException(ErrorCode.OLD_PASSWORD_ERROR))
                    .when(userService).changePassword(eq(1L), eq("wrongOld"), eq("newPass456"));

            mockMvc.perform(put("/api/sys/users/1/password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.OLD_PASSWORD_ERROR.getCode()));
        }

        @Test
        @DisplayName("should return error when user not found")
        void changePassword_userNotFound() throws Exception {
            ChangePasswordDTO dto = new ChangePasswordDTO();
            dto.setOldPassword("oldPass123");
            dto.setNewPassword("newPass456");

            doThrow(new BusinessException(ErrorCode.USER_NOT_FOUND))
                    .when(userService).changePassword(eq(99L), eq("oldPass123"), eq("newPass456"));

            mockMvc.perform(put("/api/sys/users/99/password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.USER_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/sys/users/{id}/status
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/sys/users/{id}/status")
    class UpdateUserStatusTests {

        @Test
        @DisplayName("should enable user")
        void updateUserStatus_enable() throws Exception {
            UpdateUserStatusDTO dto = new UpdateUserStatusDTO();
            dto.setStatus(1);

            doNothing().when(userService).updateUserStatus(eq(1L), eq(1));

            mockMvc.perform(put("/api/sys/users/1/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(userService).updateUserStatus(eq(1L), eq(1));
        }

        @Test
        @DisplayName("should disable user")
        void updateUserStatus_disable() throws Exception {
            UpdateUserStatusDTO dto = new UpdateUserStatusDTO();
            dto.setStatus(0);

            doNothing().when(userService).updateUserStatus(eq(1L), eq(0));

            mockMvc.perform(put("/api/sys/users/1/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(userService).updateUserStatus(eq(1L), eq(0));
        }

        @Test
        @DisplayName("should return error when user not found")
        void updateUserStatus_notFound() throws Exception {
            UpdateUserStatusDTO dto = new UpdateUserStatusDTO();
            dto.setStatus(1);

            doThrow(new BusinessException(ErrorCode.USER_NOT_FOUND))
                    .when(userService).updateUserStatus(eq(99L), eq(1));

            mockMvc.perform(put("/api/sys/users/99/status")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.USER_NOT_FOUND.getCode()));
        }
    }
}
