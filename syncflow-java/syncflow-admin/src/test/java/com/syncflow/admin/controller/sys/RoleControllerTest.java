package com.syncflow.admin.controller.sys;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.admin.dto.PermissionAssignDTO;
import com.syncflow.admin.dto.PermissionVO;
import com.syncflow.admin.entity.Role;
import com.syncflow.admin.filter.JwtAuthenticationFilter;
import com.syncflow.admin.service.RoleService;
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
import static org.mockito.ArgumentMatchers.anyString;
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

@WebMvcTest(RoleController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("RoleController")
class RoleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RoleService roleService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private Role buildRole(Long id, String code, String name) {
        Role role = new Role();
        role.setId(id);
        role.setCode(code);
        role.setName(name);
        role.setDescription(name + " role");
        role.setTenantId(1L);
        return role;
    }

    private PermissionVO buildPermissionVO(Long id, String code, String name) {
        PermissionVO vo = new PermissionVO();
        vo.setId(id);
        vo.setCode(code);
        vo.setName(name);
        vo.setType("MENU");
        vo.setSortOrder(0);
        return vo;
    }

    // -----------------------------------------------------------------------
    //  GET /api/sys/roles (paginated)
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/sys/roles")
    class GetRoleListTests {

        @Test
        @DisplayName("should return paginated role list")
        void getRoleList_success() throws Exception {
            Page<Role> page = new Page<>(1, 10);
            page.setRecords(List.of(
                    buildRole(1L, "ADMIN", "Administrator"),
                    buildRole(2L, "USER", "Normal User")
            ));
            page.setTotal(2);

            when(roleService.getRolePage(null, 1, 10)).thenReturn(page);

            mockMvc.perform(get("/api/sys/roles")
                            .param("pageNum", "1")
                            .param("pageSize", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.records").isArray())
                    .andExpect(jsonPath("$.data.records.length()").value(2))
                    .andExpect(jsonPath("$.data.total").value(2))
                    .andExpect(jsonPath("$.data.records[0].code").value("ADMIN"));

            verify(roleService).getRolePage(null, 1, 10);
        }

        @Test
        @DisplayName("should filter by keyword")
        void getRoleList_withKeyword() throws Exception {
            Page<Role> page = new Page<>(1, 10);
            page.setRecords(List.of(buildRole(1L, "ADMIN", "Administrator")));
            page.setTotal(1);

            when(roleService.getRolePage("admin", 1, 10)).thenReturn(page);

            mockMvc.perform(get("/api/sys/roles")
                            .param("keyword", "admin")
                            .param("pageNum", "1")
                            .param("pageSize", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.records.length()").value(1));

            verify(roleService).getRolePage("admin", 1, 10);
        }

        @Test
        @DisplayName("should use default pagination params")
        void getRoleList_defaultParams() throws Exception {
            Page<Role> page = new Page<>(1, 10);
            page.setRecords(List.of());
            page.setTotal(0);

            when(roleService.getRolePage(null, 1, 10)).thenReturn(page);

            mockMvc.perform(get("/api/sys/roles"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.records").isArray())
                    .andExpect(jsonPath("$.data").isNotEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/sys/roles/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/sys/roles/{id}")
    class GetRoleByIdTests {

        @Test
        @DisplayName("should return role by ID")
        void getRoleById_success() throws Exception {
            Role role = buildRole(1L, "ADMIN", "Administrator");
            when(roleService.getRoleById(1L)).thenReturn(role);

            mockMvc.perform(get("/api/sys/roles/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.code").value("ADMIN"))
                    .andExpect(jsonPath("$.data.name").value("Administrator"));

            verify(roleService).getRoleById(1L);
        }

        @Test
        @DisplayName("should return error when role not found")
        void getRoleById_notFound() throws Exception {
            when(roleService.getRoleById(99L))
                    .thenThrow(new BusinessException(ErrorCode.ROLE_NOT_FOUND));

            mockMvc.perform(get("/api/sys/roles/99"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.ROLE_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/sys/roles
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/sys/roles")
    class CreateRoleTests {

        @Test
        @DisplayName("should create role successfully")
        void createRole_success() throws Exception {
            Role role = buildRole(null, "PM", "Project Manager");
            doNothing().when(roleService).createRole(any(Role.class));

            mockMvc.perform(post("/api/sys/roles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(role)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(roleService).createRole(any(Role.class));
        }

        @Test
        @DisplayName("should return error when role code already exists")
        void createRole_duplicateCode() throws Exception {
            Role role = buildRole(null, "ADMIN", "Admin");
            doThrow(new BusinessException(ErrorCode.PARAM_ERROR, "Role code already exists"))
                    .when(roleService).createRole(any(Role.class));

            mockMvc.perform(post("/api/sys/roles")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(role)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.PARAM_ERROR.getCode()))
                    .andExpect(jsonPath("$.message").value("Role code already exists"));
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/sys/roles/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/sys/roles/{id}")
    class UpdateRoleTests {

        @Test
        @DisplayName("should update role successfully")
        void updateRole_success() throws Exception {
            Role role = buildRole(null, "PM", "Project Manager Updated");
            doNothing().when(roleService).updateRole(eq(1L), any(Role.class));

            mockMvc.perform(put("/api/sys/roles/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(role)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(roleService).updateRole(eq(1L), any(Role.class));
        }

        @Test
        @DisplayName("should return error when role not found")
        void updateRole_notFound() throws Exception {
            Role role = buildRole(null, "PM", "Project Manager");
            doThrow(new BusinessException(ErrorCode.ROLE_NOT_FOUND))
                    .when(roleService).updateRole(eq(99L), any(Role.class));

            mockMvc.perform(put("/api/sys/roles/99")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(role)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.ROLE_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  DELETE /api/sys/roles/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/sys/roles/{id}")
    class DeleteRoleTests {

        @Test
        @DisplayName("should delete role successfully")
        void deleteRole_success() throws Exception {
            doNothing().when(roleService).deleteRole(1L);

            mockMvc.perform(delete("/api/sys/roles/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(roleService).deleteRole(1L);
        }

        @Test
        @DisplayName("should return error when role not found")
        void deleteRole_notFound() throws Exception {
            doThrow(new BusinessException(ErrorCode.ROLE_NOT_FOUND))
                    .when(roleService).deleteRole(99L);

            mockMvc.perform(delete("/api/sys/roles/99"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.ROLE_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/sys/roles/{roleId}/permissions
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/sys/roles/{roleId}/permissions")
    class GetRolePermissionsTests {

        @Test
        @DisplayName("should return permissions for a role")
        void getRolePermissions_success() throws Exception {
            List<PermissionVO> permissions = List.of(
                    buildPermissionVO(1L, "project:view", "View Projects"),
                    buildPermissionVO(2L, "project:create", "Create Projects")
            );
            when(roleService.getRolePermissions(1L)).thenReturn(permissions);

            mockMvc.perform(get("/api/sys/roles/1/permissions"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data.length()").value(2))
                    .andExpect(jsonPath("$.data[0].code").value("project:view"))
                    .andExpect(jsonPath("$.data[1].code").value("project:create"));

            verify(roleService).getRolePermissions(1L);
        }

        @Test
        @DisplayName("should return empty list when role has no permissions")
        void getRolePermissions_empty() throws Exception {
            when(roleService.getRolePermissions(1L)).thenReturn(List.of());

            mockMvc.perform(get("/api/sys/roles/1/permissions"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data").isEmpty());
        }

        @Test
        @DisplayName("should return error when role not found")
        void getRolePermissions_roleNotFound() throws Exception {
            when(roleService.getRolePermissions(99L))
                    .thenThrow(new BusinessException(ErrorCode.ROLE_NOT_FOUND));

            mockMvc.perform(get("/api/sys/roles/99/permissions"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.ROLE_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/sys/roles/{roleId}/permissions
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/sys/roles/{roleId}/permissions")
    class AssignRolePermissionsTests {

        @Test
        @DisplayName("should assign permissions to role")
        void assignPermissions_success() throws Exception {
            PermissionAssignDTO dto = new PermissionAssignDTO();
            dto.setPermissionIds(List.of(1L, 2L, 3L));

            doNothing().when(roleService).assignPermissions(eq(1L), any());

            mockMvc.perform(put("/api/sys/roles/1/permissions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(roleService).assignPermissions(eq(1L), eq(List.of(1L, 2L, 3L)));
        }

        @Test
        @DisplayName("should return error when role not found")
        void assignPermissions_roleNotFound() throws Exception {
            PermissionAssignDTO dto = new PermissionAssignDTO();
            dto.setPermissionIds(List.of(1L));

            doThrow(new BusinessException(ErrorCode.ROLE_NOT_FOUND))
                    .when(roleService).assignPermissions(eq(99L), any());

            mockMvc.perform(put("/api/sys/roles/99/permissions")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.ROLE_NOT_FOUND.getCode()));
        }
    }
}
