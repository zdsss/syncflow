package com.syncflow.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.admin.dto.CreateUserDTO;
import com.syncflow.admin.dto.UserVO;
import com.syncflow.admin.entity.Department;
import com.syncflow.admin.entity.User;
import com.syncflow.admin.entity.UserRole;
import com.syncflow.admin.mapper.DepartmentMapper;
import com.syncflow.admin.mapper.RoleMapper;
import com.syncflow.admin.mapper.UserMapper;
import com.syncflow.admin.mapper.UserRoleMapper;
import com.syncflow.admin.service.impl.UserServiceImpl;
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
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService")
class UserServiceTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private DepartmentMapper departmentMapper;

    @Mock
    private RoleMapper roleMapper;

    @Mock
    private UserRoleMapper userRoleMapper;

    @InjectMocks
    private UserServiceImpl userService;

    // Use a real BCryptPasswordEncoder (not mockable on Java 21+)
    private final BCryptPasswordEncoder realEncoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() throws Exception {
        // Inject real encoder (service creates its own internally)
        Field encoderField = UserServiceImpl.class.getDeclaredField("passwordEncoder");
        encoderField.setAccessible(true);
        encoderField.set(userService, realEncoder);
    }

    private User buildUser(Long id, String username) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setRealName("Real " + username);
        user.setPhone("1234567890");
        user.setEmail(username + "@test.com");
        user.setStatus(1);
        user.setDeptId(1L);
        return user;
    }

    private CreateUserDTO buildCreateUserDTO(String username) {
        CreateUserDTO dto = new CreateUserDTO();
        dto.setUsername(username);
        dto.setPassword("password123");
        dto.setRealName("Real " + username);
        dto.setPhone("1234567890");
        dto.setEmail(username + "@test.com");
        dto.setDeptId(1L);
        dto.setRoleIds(List.of(1L));
        return dto;
    }

    // -----------------------------------------------------------------------
    //  getUserList
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getUserList()")
    class GetUserList {

        @Test
        @DisplayName("should return paginated user list")
        void shouldReturnPaginatedUserList() {
            User user = buildUser(1L, "admin");
            Page<User> userPage = new Page<>(1, 10);
            userPage.setRecords(List.of(user));
            userPage.setTotal(1);

            when(userMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                    .thenReturn(userPage);
            when(departmentMapper.selectById(1L)).thenReturn(buildDepartment());
            when(userRoleMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of());

            Page<UserVO> result = userService.getUserList(null, 1, 10);

            assertNotNull(result);
            assertEquals(1, result.getRecords().size());
            assertEquals("admin", result.getRecords().get(0).getUsername());
            assertEquals(1L, result.getTotal());
            verify(userMapper).selectPage(any(Page.class), any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("should return empty page when no users")
        void shouldReturnEmptyPage() {
            Page<User> emptyPage = new Page<>(1, 10);
            emptyPage.setRecords(Collections.emptyList());
            emptyPage.setTotal(0);

            when(userMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                    .thenReturn(emptyPage);

            Page<UserVO> result = userService.getUserList(null, 1, 10);

            assertNotNull(result);
            assertTrue(result.getRecords().isEmpty());
            assertEquals(0L, result.getTotal());
        }
    }

    // -----------------------------------------------------------------------
    //  getUserById
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getUserById()")
    class GetUserById {

        @Test
        @DisplayName("should return UserVO when user exists")
        void shouldReturnUserVO() {
            User user = buildUser(1L, "admin");
            when(userMapper.selectById(1L)).thenReturn(user);
            when(departmentMapper.selectById(1L)).thenReturn(buildDepartment());
            when(userRoleMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of());

            UserVO result = userService.getUserById(1L);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals("admin", result.getUsername());
            assertEquals("Real admin", result.getRealName());
            verify(userMapper).selectById(1L);
        }

        @Test
        @DisplayName("should throw when user not found")
        void shouldThrowWhenUserNotFound() {
            when(userMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> userService.getUserById(999L));
            assertEquals("User not found", ex.getMessage());
            verify(userMapper).selectById(999L);
        }
    }

    // -----------------------------------------------------------------------
    //  createUser
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("createUser()")
    class CreateUser {

        @Test
        @DisplayName("should create user successfully with encoded password")
        void shouldCreateUser() {
            CreateUserDTO dto = buildCreateUserDTO("newuser");
            when(userMapper.selectByUsername("newuser")).thenReturn(null);
            when(userMapper.insert(any(User.class))).thenReturn(1);
            when(userRoleMapper.insert(any(UserRole.class))).thenReturn(1);

            userService.createUser(dto);

            verify(userMapper).selectByUsername("newuser");
            verify(userMapper).insert(argThat((User u) ->
                    "newuser".equals(u.getUsername())
                            && realEncoder.matches("password123", u.getPassword())
                            && u.getStatus() == 1
            ));
            verify(userRoleMapper).insert(any(UserRole.class));
        }

        @Test
        @DisplayName("should throw when username already exists")
        void shouldThrowWhenUsernameExists() {
            CreateUserDTO dto = buildCreateUserDTO("existinguser");
            User existing = buildUser(1L, "existinguser");
            when(userMapper.selectByUsername("existinguser")).thenReturn(existing);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> userService.createUser(dto));
            assertEquals("Username already exists", ex.getMessage());
            verify(userMapper, never()).insert(any(User.class));
        }
    }

    // -----------------------------------------------------------------------
    //  updateUser
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("updateUser()")
    class UpdateUser {

        @Test
        @DisplayName("should update user fields")
        void shouldUpdateUser() {
            User existing = buildUser(1L, "admin");
            CreateUserDTO dto = buildCreateUserDTO("admin");
            dto.setRealName("Updated Name");

            when(userMapper.selectById(1L)).thenReturn(existing);
            when(userMapper.updateById(any(User.class))).thenReturn(1);
            when(userRoleMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            when(userRoleMapper.insert(any(UserRole.class))).thenReturn(1);

            userService.updateUser(1L, dto);

            verify(userMapper).selectById(1L);
            verify(userMapper).updateById(argThat((User u) ->
                    "Updated Name".equals(u.getRealName())
            ));
            verify(userRoleMapper).delete(any(LambdaQueryWrapper.class));
            verify(userRoleMapper).insert(any(UserRole.class));
        }

        @Test
        @DisplayName("should throw when user not found")
        void shouldThrowWhenUserNotFound() {
            CreateUserDTO dto = buildCreateUserDTO("admin");
            when(userMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> userService.updateUser(999L, dto));
            assertEquals("User not found", ex.getMessage());
            verify(userMapper, never()).updateById(any(User.class));
        }
    }

    // -----------------------------------------------------------------------
    //  deleteUser
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("deleteUser()")
    class DeleteUser {

        @Test
        @DisplayName("should delete user when exists")
        void shouldDeleteUser() {
            User existing = buildUser(1L, "admin");
            when(userMapper.selectById(1L)).thenReturn(existing);
            when(userMapper.deleteById(1L)).thenReturn(1);

            userService.deleteUser(1L);

            verify(userMapper).selectById(1L);
            verify(userMapper).deleteById(1L);
        }

        @Test
        @DisplayName("should throw when user not found")
        void shouldThrowWhenUserNotFound() {
            when(userMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> userService.deleteUser(999L));
            assertEquals("User not found", ex.getMessage());
            verify(userMapper, never()).deleteById(anyLong());
        }
    }

    // -----------------------------------------------------------------------
    //  changePassword
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("changePassword()")
    class ChangePassword {

        @Test
        @DisplayName("should change password when old password matches")
        void shouldChangePassword() {
            User user = buildUser(1L, "admin");
            user.setPassword(realEncoder.encode("oldPass123"));
            when(userMapper.selectById(1L)).thenReturn(user);
            when(userMapper.updateById(any(User.class))).thenReturn(1);

            userService.changePassword(1L, "oldPass123", "newPass456");

            verify(userMapper).selectById(1L);
            verify(userMapper).updateById(argThat((User u) ->
                    realEncoder.matches("newPass456", u.getPassword())
            ));
        }

        @Test
        @DisplayName("should throw when user not found")
        void shouldThrowWhenUserNotFound() {
            when(userMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> userService.changePassword(999L, "oldPass", "newPass"));
            assertEquals("User not found", ex.getMessage());
        }

        @Test
        @DisplayName("should throw when old password is incorrect")
        void shouldThrowWhenOldPasswordIncorrect() {
            User user = buildUser(1L, "admin");
            user.setPassword(realEncoder.encode("correctOldPass"));
            when(userMapper.selectById(1L)).thenReturn(user);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> userService.changePassword(1L, "wrongOldPass", "newPass"));
            assertEquals("Old password is incorrect", ex.getMessage());
            verify(userMapper, never()).updateById(any(User.class));
        }
    }

    // -----------------------------------------------------------------------
    //  updateUserStatus
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("updateUserStatus()")
    class UpdateUserStatus {

        @Test
        @DisplayName("should enable user")
        void shouldEnableUser() {
            User user = buildUser(1L, "admin");
            user.setStatus(0);
            when(userMapper.selectById(1L)).thenReturn(user);
            when(userMapper.updateById(any(User.class))).thenReturn(1);

            userService.updateUserStatus(1L, 1);

            verify(userMapper).selectById(1L);
            verify(userMapper).updateById(argThat((User u) -> u.getStatus() == 1));
        }

        @Test
        @DisplayName("should disable user")
        void shouldDisableUser() {
            User user = buildUser(1L, "admin");
            user.setStatus(1);
            when(userMapper.selectById(1L)).thenReturn(user);
            when(userMapper.updateById(any(User.class))).thenReturn(1);

            userService.updateUserStatus(1L, 0);

            verify(userMapper).selectById(1L);
            verify(userMapper).updateById(argThat((User u) -> u.getStatus() == 0));
        }

        @Test
        @DisplayName("should throw when user not found")
        void shouldThrowWhenUserNotFound() {
            when(userMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> userService.updateUserStatus(999L, 1));
            assertEquals("User not found", ex.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    //  Helper
    // -----------------------------------------------------------------------

    private Department buildDepartment() {
        Department dept = new Department();
        dept.setId(1L);
        dept.setName("Engineering");
        return dept;
    }
}
