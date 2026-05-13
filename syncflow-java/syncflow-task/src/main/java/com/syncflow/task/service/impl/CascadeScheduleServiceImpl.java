package com.syncflow.task.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.task.entity.Task;
import com.syncflow.task.entity.TaskDependency;
import com.syncflow.task.mapper.TaskDependencyMapper;
import com.syncflow.task.mapper.TaskMapper;
import com.syncflow.task.service.CascadeScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CascadeScheduleServiceImpl implements CascadeScheduleService {

    private final TaskMapper taskMapper;
    private final TaskDependencyMapper dependencyMapper;

    @Override
    @Transactional
    public void cascadeSchedule(Long taskId, LocalDate newStart, LocalDate newEnd) {
        Task task = taskMapper.selectById(taskId);
        if (task == null) {
            throw new BusinessException(ErrorCode.TASK_NOT_FOUND);
        }
        cascade(taskId, newStart, newEnd, new ArrayDeque<>());
    }

    @Override
    @Transactional
    public void updateSchedule(Long taskId, LocalDate newStart, LocalDate newEnd) {
        Task task = taskMapper.selectById(taskId);
        if (task == null) {
            throw new BusinessException(ErrorCode.TASK_NOT_FOUND);
        }
        task.setPlannedStart(newStart);
        task.setPlannedEnd(newEnd);
        taskMapper.updateById(task);
    }

    @Override
    public List<Task> previewCascade(Long taskId, LocalDate newStart, LocalDate newEnd) {
        Task task = taskMapper.selectById(taskId);
        if (task == null) {
            throw new BusinessException(ErrorCode.TASK_NOT_FOUND);
        }
        List<Task> affected = new ArrayList<>();
        cascadePreview(taskId, newStart, newEnd, affected, new ArrayDeque<>());
        return affected;
    }

    // -----------------------------------------------------------------------
    //  Recursive cascade (persisting)
    // -----------------------------------------------------------------------

    private void cascade(Long taskId, LocalDate newStart, LocalDate newEnd, Deque<Long> visited) {
        if (!visited.add(taskId)) {
            return;
        }

        Task task = taskMapper.selectById(taskId);
        long duration = safeDuration(task.getPlannedStart(), task.getPlannedEnd());

        task.setPlannedStart(newStart);
        task.setPlannedEnd(newEnd);
        taskMapper.updateById(task);

        cascadeDependents(taskId, newStart, newEnd, duration, visited);
    }

    private void cascadeDependents(Long taskId, LocalDate newStart, LocalDate newEnd,
                                   long currentDuration, Deque<Long> visited) {
        List<TaskDependency> dependencies = dependencyMapper.selectList(
                new LambdaQueryWrapper<TaskDependency>()
                        .eq(TaskDependency::getDependsOnTaskId, taskId)
        );

        for (TaskDependency dep : dependencies) {
            Long dependentId = dep.getTaskId();
            if (visited.contains(dependentId)) {
                continue;
            }

            Task dependent = taskMapper.selectById(dependentId);
            if (dependent == null) {
                continue;
            }
            if (dependent.getStatus() != null && dependent.getStatus() == 4) {
                continue;
            }

            long depDuration = safeDuration(dependent.getPlannedStart(), dependent.getPlannedEnd());
            LocalDate[] newDates = calculateDependentDates(dep.getDependencyType(),
                    newStart, newEnd, currentDuration, depDuration);
            if (newDates == null) {
                continue;
            }

            cascade(dependentId, newDates[0], newDates[1], visited);
        }
    }

    // -----------------------------------------------------------------------
    //  Recursive cascade (preview only, no persistence)
    // -----------------------------------------------------------------------

    private void cascadePreview(Long taskId, LocalDate newStart, LocalDate newEnd,
                                List<Task> affected, Deque<Long> visited) {
        if (!visited.add(taskId)) {
            return;
        }

        Task task = taskMapper.selectById(taskId);
        long duration = safeDuration(task.getPlannedStart(), task.getPlannedEnd());

        task.setPlannedStart(newStart);
        task.setPlannedEnd(newEnd);
        affected.add(task);

        List<TaskDependency> dependencies = dependencyMapper.selectList(
                new LambdaQueryWrapper<TaskDependency>()
                        .eq(TaskDependency::getDependsOnTaskId, taskId)
        );

        for (TaskDependency dep : dependencies) {
            Long dependentId = dep.getTaskId();
            if (visited.contains(dependentId)) {
                continue;
            }

            Task dependent = taskMapper.selectById(dependentId);
            if (dependent == null) {
                continue;
            }
            if (dependent.getStatus() != null && dependent.getStatus() == 4) {
                continue;
            }

            long depDuration = safeDuration(dependent.getPlannedStart(), dependent.getPlannedEnd());
            LocalDate[] newDates = calculateDependentDates(dep.getDependencyType(),
                    newStart, newEnd, duration, depDuration);
            if (newDates == null) {
                continue;
            }

            cascadePreview(dependentId, newDates[0], newDates[1], affected, visited);
        }
    }

    // -----------------------------------------------------------------------
    //  Date calculation helpers
    // -----------------------------------------------------------------------

    private long safeDuration(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            return 0;
        }
        return ChronoUnit.DAYS.between(start, end);
    }

    private LocalDate[] calculateDependentDates(String dependencyType,
                                                LocalDate currentStart, LocalDate currentEnd,
                                                long currentDuration, long depDuration) {
        return switch (dependencyType) {
            case "FS" -> {
                if (currentEnd == null) yield null;
                LocalDate depStart = currentEnd.plusDays(1);
                LocalDate depEnd = depStart.plusDays(depDuration);
                yield new LocalDate[]{depStart, depEnd};
            }
            case "SS" -> {
                if (currentStart == null) yield null;
                LocalDate depStart = currentStart;
                LocalDate depEnd = depStart.plusDays(depDuration);
                yield new LocalDate[]{depStart, depEnd};
            }
            case "SF" -> {
                if (currentStart == null) yield null;
                LocalDate depEnd = currentStart.minusDays(1);
                LocalDate depStart = depEnd.minusDays(depDuration);
                yield new LocalDate[]{depStart, depEnd};
            }
            case "FF" -> {
                if (currentEnd == null) yield null;
                LocalDate depEnd = currentEnd;
                LocalDate depStart = depEnd.minusDays(depDuration);
                yield new LocalDate[]{depStart, depEnd};
            }
            default -> throw new BusinessException(ErrorCode.DEPENDENCY_INVALID_TYPE,
                    "Unknown dependency type: " + dependencyType);
        };
    }
}
