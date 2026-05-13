package com.syncflow.task.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.task.entity.Task;
import com.syncflow.task.entity.TaskDependency;
import com.syncflow.task.mapper.TaskDependencyMapper;
import com.syncflow.task.mapper.TaskMapper;
import com.syncflow.task.service.TaskDependencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class TaskDependencyServiceImpl implements TaskDependencyService {

    private final TaskDependencyMapper dependencyMapper;
    private final TaskMapper taskMapper;

    private static final Set<String> VALID_TYPES = Set.of("SS", "SF", "FS", "FF");

    @Override
    @Transactional
    public TaskDependency createDependency(Long taskId, Long dependsOnTaskId, String dependencyType, Long userId) {
        if (taskId.equals(dependsOnTaskId)) {
            throw new BusinessException(ErrorCode.DEPENDENCY_SELF);
        }

        Task task = taskMapper.selectById(taskId);
        if (task == null) throw new BusinessException(ErrorCode.TASK_NOT_FOUND);

        Task dependsOn = taskMapper.selectById(dependsOnTaskId);
        if (dependsOn == null) throw new BusinessException(ErrorCode.TASK_NOT_FOUND);

        if (!Objects.equals(task.getProjectId(), dependsOn.getProjectId())) {
            throw new BusinessException(ErrorCode.DEPENDENCY_CROSS_PROJECT);
        }

        List<TaskDependency> existing = dependencyMapper.selectList(
                new LambdaQueryWrapper<TaskDependency>()
                        .eq(TaskDependency::getTaskId, taskId)
                        .eq(TaskDependency::getDependsOnTaskId, dependsOnTaskId)
        );
        if (!existing.isEmpty()) {
            throw new BusinessException(ErrorCode.DEPENDENCY_DUPLICATE);
        }

        if (hasCycle(taskId, dependsOnTaskId)) {
            throw new BusinessException(ErrorCode.DEPENDENCY_CYCLE);
        }

        TaskDependency dep = new TaskDependency();
        dep.setTenantId(task.getTenantId());
        dep.setTaskId(taskId);
        dep.setDependsOnTaskId(dependsOnTaskId);
        dep.setDependencyType(dependencyType);
        dep.setCreatedBy(userId);
        dependencyMapper.insert(dep);
        return dep;
    }

    @Override
    public List<TaskDependency> getDependenciesByTask(Long taskId) {
        return dependencyMapper.selectList(
                new LambdaQueryWrapper<TaskDependency>()
                        .eq(TaskDependency::getTaskId, taskId)
        );
    }

    @Override
    public List<TaskDependency> getDependenciesByProject(Long projectId) {
        List<Task> projectTasks = taskMapper.selectList(
                new LambdaQueryWrapper<Task>()
                        .eq(Task::getProjectId, projectId)
                        .select(Task::getId)
        );
        if (projectTasks.isEmpty()) return Collections.emptyList();

        Set<Long> taskIds = new HashSet<>();
        for (Task t : projectTasks) taskIds.add(t.getId());

        return dependencyMapper.selectList(
                new LambdaQueryWrapper<TaskDependency>()
                        .in(TaskDependency::getTaskId, taskIds)
        );
    }

    @Override
    @Transactional
    public void deleteDependency(Long dependencyId, Long userId) {
        TaskDependency dep = dependencyMapper.selectById(dependencyId);
        if (dep == null) {
            throw new BusinessException(ErrorCode.DEPENDENCY_NOT_FOUND);
        }
        if (!Objects.equals(dep.getCreatedBy(), userId)) {
            throw new BusinessException(ErrorCode.DEPENDENCY_FORBIDDEN);
        }
        dependencyMapper.deleteById(dependencyId);
    }

    @Override
    @Transactional
    public TaskDependency updateDependencyType(Long dependencyId, String newType) {
        if (!VALID_TYPES.contains(newType)) {
            throw new BusinessException(ErrorCode.DEPENDENCY_INVALID_TYPE);
        }
        TaskDependency dep = dependencyMapper.selectById(dependencyId);
        if (dep == null) {
            throw new BusinessException(ErrorCode.DEPENDENCY_NOT_FOUND);
        }
        dep.setDependencyType(newType);
        dependencyMapper.updateById(dep);
        return dep;
    }

    @Override
    public boolean hasCycle(Long taskId, Long newDependsOnId) {
        Set<Long> visited = new HashSet<>();
        Deque<Long> stack = new ArrayDeque<>();
        stack.push(newDependsOnId);

        while (!stack.isEmpty()) {
            Long current = stack.pop();
            if (current.equals(taskId)) return true;
            if (!visited.add(current)) continue;

            List<TaskDependency> deps = dependencyMapper.selectList(
                    new LambdaQueryWrapper<TaskDependency>()
                            .eq(TaskDependency::getTaskId, current)
                            .select(TaskDependency::getDependsOnTaskId)
            );
            for (TaskDependency d : deps) {
                stack.push(d.getDependsOnTaskId());
            }
        }
        return false;
    }
}
