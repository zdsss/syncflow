package com.syncflow.admin.controller.sys;

import com.syncflow.admin.entity.Department;
import com.syncflow.admin.service.DepartmentService;
import com.syncflow.common.result.Result;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Department management controller
 */
@RestController
@RequestMapping("/api/sys/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    /**
     * Get department tree structure
     */
    @GetMapping("/tree")
    public Result<List<Map<String, Object>>> getDepartmentTree() {
        List<Map<String, Object>> tree = departmentService.getDepartmentTree();
        return Result.success(tree);
    }

    /**
     * Get flat list of all departments
     */
    @GetMapping
    public Result<List<Department>> getDepartmentList() {
        List<Department> departments = departmentService.getDepartmentList();
        return Result.success(departments);
    }

    /**
     * Get single department by ID
     */
    @GetMapping("/{id}")
    public Result<Department> getDepartmentById(@PathVariable Long id) {
        Department dept = departmentService.getDepartmentById(id);
        return Result.success(dept);
    }

    /**
     * Create a new department
     */
    @PostMapping
    public Result<Void> createDepartment(@RequestBody Department department) {
        departmentService.createDepartment(department);
        return Result.success();
    }

    /**
     * Update an existing department
     */
    @PutMapping("/{id}")
    public Result<Void> updateDepartment(@PathVariable Long id,
                                         @RequestBody Department department) {
        departmentService.updateDepartment(id, department);
        return Result.success();
    }

    /**
     * Delete a department (soft delete)
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return Result.success();
    }
}
