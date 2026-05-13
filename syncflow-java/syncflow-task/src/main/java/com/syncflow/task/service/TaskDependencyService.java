package com.syncflow.task.service;

import com.syncflow.task.entity.TaskDependency;

import java.util.List;

public interface TaskDependencyService {

    TaskDependency createDependency(Long taskId, Long dependsOnTaskId, String dependencyType, Long userId);

    List<TaskDependency> getDependenciesByTask(Long taskId);

    List<TaskDependency> getDependenciesByProject(Long projectId);

    void deleteDependency(Long dependencyId, Long userId);

    TaskDependency updateDependencyType(Long dependencyId, String newType);

    boolean hasCycle(Long taskId, Long newDependsOnId);
}
