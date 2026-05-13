package com.syncflow.admin.service;

import com.syncflow.admin.entity.Department;

import java.util.List;
import java.util.Map;

/**
 * Department service interface
 */
public interface DepartmentService {

    /**
     * Get department tree structure
     */
    List<Map<String, Object>> getDepartmentTree();

    /**
     * Create a new department
     */
    void createDepartment(Department department);

    /**
     * Update an existing department
     */
    void updateDepartment(Long id, Department department);

    /**
     * Soft-delete a department
     */
    void deleteDepartment(Long id);

    /**
     * Get flat list of all departments
     */
    List<Department> getDepartmentList();

    /**
     * Get single department by ID
     */
    Department getDepartmentById(Long id);
}
