package com.syncflow.task.service;

import com.syncflow.task.entity.Task;
import java.time.LocalDate;
import java.util.List;

public interface CascadeScheduleService {

    /**
     * Cascade-schedule a task and all its downstream dependents.
     *
     * @param taskId  the task whose dates are being changed
     * @param newStart new planned start date
     * @param newEnd   new planned end date
     */
    void cascadeSchedule(Long taskId, LocalDate newStart, LocalDate newEnd);

    /**
     * Update a single task's planned dates without cascading to dependents.
     *
     * @param taskId  the task to update
     * @param newStart new planned start date
     * @param newEnd   new planned end date
     */
    void updateSchedule(Long taskId, LocalDate newStart, LocalDate newEnd);

    /**
     * Preview the cascade effect without persisting any changes.
     *
     * @param taskId  the task whose dates are being changed
     * @param newStart new planned start date
     * @param newEnd   new planned end date
     * @return list of tasks that would be affected (including the original task)
     */
    List<Task> previewCascade(Long taskId, LocalDate newStart, LocalDate newEnd);
}
