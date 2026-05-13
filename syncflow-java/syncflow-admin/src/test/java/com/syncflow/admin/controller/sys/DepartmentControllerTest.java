package com.syncflow.admin.controller.sys;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.admin.entity.Department;
import com.syncflow.admin.filter.JwtAuthenticationFilter;
import com.syncflow.admin.service.DepartmentService;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
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

@WebMvcTest(DepartmentController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("DepartmentController")
class DepartmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DepartmentService departmentService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private Map<String, Object> buildDepartmentNode(Long id, String name) {
        Map<String, Object> node = new HashMap<>();
        node.put("id", id);
        node.put("name", name);
        node.put("code", "DEPT-" + id);
        node.put("children", new ArrayList<>());
        return node;
    }

    private Department buildDepartment(String name) {
        Department dept = new Department();
        dept.setName(name);
        dept.setCode("DEPT-" + name.toUpperCase());
        dept.setParentId(0L);
        return dept;
    }

    // -----------------------------------------------------------------------
    //  GET /api/sys/departments/tree
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/sys/departments/tree")
    class GetDepartmentTreeTests {

        @Test
        @DisplayName("should return department tree")
        void getDepartmentTree_success() throws Exception {
            Map<String, Object> root = buildDepartmentNode(1L, "Company");
            Map<String, Object> child = buildDepartmentNode(2L, "Engineering");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> children = (List<Map<String, Object>>) root.get("children");
            children.add(child);

            when(departmentService.getDepartmentTree()).thenReturn(List.of(root));

            mockMvc.perform(get("/api/sys/departments/tree"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].name").value("Company"))
                    .andExpect(jsonPath("$.data[0].children[0].name").value("Engineering"));

            verify(departmentService).getDepartmentTree();
        }

        @Test
        @DisplayName("should return empty tree when no departments exist")
        void getDepartmentTree_empty() throws Exception {
            when(departmentService.getDepartmentTree()).thenReturn(List.of());

            mockMvc.perform(get("/api/sys/departments/tree"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/sys/departments
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/sys/departments")
    class CreateDepartmentTests {

        @Test
        @DisplayName("should create department successfully")
        void createDepartment_success() throws Exception {
            Department dept = buildDepartment("Engineering");
            doNothing().when(departmentService).createDepartment(any(Department.class));

            mockMvc.perform(post("/api/sys/departments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dept)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(departmentService).createDepartment(any(Department.class));
        }

        @Test
        @DisplayName("should return error when department name already exists")
        void createDepartment_duplicate() throws Exception {
            Department dept = buildDepartment("Existing");
            doThrow(new BusinessException(ErrorCode.PARAM_ERROR, "Department name already exists"))
                    .when(departmentService).createDepartment(any(Department.class));

            mockMvc.perform(post("/api/sys/departments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dept)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.PARAM_ERROR.getCode()))
                    .andExpect(jsonPath("$.message").value("Department name already exists"));
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/sys/departments/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/sys/departments/{id}")
    class UpdateDepartmentTests {

        @Test
        @DisplayName("should update department successfully")
        void updateDepartment_success() throws Exception {
            Department dept = buildDepartment("Updated Name");
            doNothing().when(departmentService).updateDepartment(eq(1L), any(Department.class));

            mockMvc.perform(put("/api/sys/departments/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dept)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(departmentService).updateDepartment(eq(1L), any(Department.class));
        }

        @Test
        @DisplayName("should return error when department not found")
        void updateDepartment_notFound() throws Exception {
            Department dept = buildDepartment("Ghost");
            doThrow(new BusinessException(ErrorCode.NOT_FOUND))
                    .when(departmentService).updateDepartment(eq(99L), any(Department.class));

            mockMvc.perform(put("/api/sys/departments/99")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dept)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  DELETE /api/sys/departments/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/sys/departments/{id}")
    class DeleteDepartmentTests {

        @Test
        @DisplayName("should delete department successfully")
        void deleteDepartment_success() throws Exception {
            doNothing().when(departmentService).deleteDepartment(1L);

            mockMvc.perform(delete("/api/sys/departments/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(departmentService).deleteDepartment(1L);
        }

        @Test
        @DisplayName("should return error when department not found")
        void deleteDepartment_notFound() throws Exception {
            doThrow(new BusinessException(ErrorCode.NOT_FOUND))
                    .when(departmentService).deleteDepartment(99L);

            mockMvc.perform(delete("/api/sys/departments/99"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/sys/departments
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/sys/departments")
    class GetDepartmentListTests {

        @Test
        @DisplayName("should return flat list of all departments")
        void getDepartmentList_success() throws Exception {
            Department dept1 = buildDepartment("Engineering");
            dept1.setId(1L);
            Department dept2 = buildDepartment("Marketing");
            dept2.setId(2L);

            when(departmentService.getDepartmentList()).thenReturn(List.of(dept1, dept2));

            mockMvc.perform(get("/api/sys/departments"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data.length()").value(2))
                    .andExpect(jsonPath("$.data[0].name").value("Engineering"))
                    .andExpect(jsonPath("$.data[1].name").value("Marketing"));

            verify(departmentService).getDepartmentList();
        }

        @Test
        @DisplayName("should return empty list when no departments exist")
        void getDepartmentList_empty() throws Exception {
            when(departmentService.getDepartmentList()).thenReturn(List.of());

            mockMvc.perform(get("/api/sys/departments"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/sys/departments/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/sys/departments/{id}")
    class GetDepartmentByIdTests {

        @Test
        @DisplayName("should return department by ID")
        void getDepartmentById_success() throws Exception {
            Department dept = buildDepartment("Engineering");
            dept.setId(1L);

            when(departmentService.getDepartmentById(1L)).thenReturn(dept);

            mockMvc.perform(get("/api/sys/departments/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.name").value("Engineering"));

            verify(departmentService).getDepartmentById(1L);
        }

        @Test
        @DisplayName("should return error when department not found")
        void getDepartmentById_notFound() throws Exception {
            when(departmentService.getDepartmentById(99L))
                    .thenThrow(new BusinessException(ErrorCode.DEPARTMENT_NOT_FOUND));

            mockMvc.perform(get("/api/sys/departments/99"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.DEPARTMENT_NOT_FOUND.getCode()));
        }
    }
}
