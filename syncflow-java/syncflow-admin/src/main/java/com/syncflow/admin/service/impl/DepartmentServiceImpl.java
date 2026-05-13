package com.syncflow.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.admin.entity.Department;
import com.syncflow.admin.mapper.DepartmentMapper;
import com.syncflow.admin.service.DepartmentService;
import com.syncflow.common.config.CacheConfig;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Department service implementation with tree operations
 */
@Service
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentMapper departmentMapper;

    public DepartmentServiceImpl(DepartmentMapper departmentMapper) {
        this.departmentMapper = departmentMapper;
    }

    @Override
    @Cacheable(CacheConfig.CACHE_DEPT_TREE)
    public List<Map<String, Object>> getDepartmentTree() {
        // Fetch all departments (excluding soft-deleted)
        LambdaQueryWrapper<Department> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(Department::getSortOrder);
        List<Department> allDepts = departmentMapper.selectList(wrapper);

        // Build tree
        return buildTree(allDepts, null);
    }

    @Override
    @CacheEvict(value = CacheConfig.CACHE_DEPT_TREE, allEntries = true)
    public void createDepartment(Department department) {
        // Validate unique code
        if (StringUtils.hasText(department.getCode())) {
            LambdaQueryWrapper<Department> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Department::getCode, department.getCode());
            Long count = departmentMapper.selectCount(wrapper);
            if (count > 0) {
                throw new BusinessException(ErrorCode.PARAM_ERROR, "Department code already exists");
            }
        }
        departmentMapper.insert(department);
    }

    @Override
    @CacheEvict(value = CacheConfig.CACHE_DEPT_TREE, allEntries = true)
    public void updateDepartment(Long id, Department department) {
        Department existing = departmentMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "Department not found");
        }

        // Validate unique code (excluding current record)
        if (StringUtils.hasText(department.getCode())) {
            LambdaQueryWrapper<Department> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Department::getCode, department.getCode())
                    .ne(Department::getId, id);
            Long count = departmentMapper.selectCount(wrapper);
            if (count > 0) {
                throw new BusinessException(ErrorCode.PARAM_ERROR, "Department code already exists");
            }
        }

        department.setId(id);
        departmentMapper.updateById(department);
    }

    @Override
    @CacheEvict(value = CacheConfig.CACHE_DEPT_TREE, allEntries = true)
    public void deleteDepartment(Long id) {
        Department existing = departmentMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "Department not found");
        }

        // Check if department has children
        LambdaQueryWrapper<Department> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Department::getParentId, id);
        Long childCount = departmentMapper.selectCount(wrapper);
        if (childCount > 0) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "Cannot delete department with sub-departments");
        }

        departmentMapper.deleteById(id);
    }

    @Override
    public List<Department> getDepartmentList() {
        LambdaQueryWrapper<Department> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(Department::getSortOrder);
        return departmentMapper.selectList(wrapper);
    }

    @Override
    public Department getDepartmentById(Long id) {
        Department dept = departmentMapper.selectById(id);
        if (dept == null) {
            throw new BusinessException(ErrorCode.DEPARTMENT_NOT_FOUND);
        }
        return dept;
    }

    /**
     * Recursively build department tree from flat list
     */
    private List<Map<String, Object>> buildTree(List<Department> allDepts, Long parentId) {
        return allDepts.stream()
                .filter(dept -> Objects.equals(dept.getParentId(), parentId))
                .map(dept -> {
                    Map<String, Object> node = new LinkedHashMap<>();
                    node.put("id", dept.getId());
                    node.put("name", dept.getName());
                    node.put("code", dept.getCode());
                    node.put("parentId", dept.getParentId());
                    node.put("sortOrder", dept.getSortOrder());
                    node.put("children", buildTree(allDepts, dept.getId()));
                    return node;
                })
                .collect(Collectors.toList());
    }
}
