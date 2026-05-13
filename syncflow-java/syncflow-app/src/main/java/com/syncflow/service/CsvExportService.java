package com.syncflow.service;

import com.syncflow.project.entity.Project;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.task.entity.Task;
import com.syncflow.task.mapper.TaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * CSV export service for tasks and projects.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CsvExportService {

    private final TaskMapper taskMapper;
    private final ProjectMapper projectMapper;

    private static final String[] TASK_HEADERS = {
            "task_no", "title", "type", "status", "assignee_id", "progress",
            "planned_start", "planned_end", "actual_start", "actual_end"
    };

    private static final String[] PROJECT_HEADERS = {
            "code", "name", "status", "owner_id", "planned_start", "planned_end"
    };

    public void exportTasks(Long projectId, OutputStream out) throws IOException {
        List<Task> tasks;
        if (projectId != null) {
            tasks = taskMapper.selectList(
                    new com.baomidou.mybatisplus.core.conditions.query.QueryWrapper<Task>()
                            .eq("project_id", projectId));
        } else {
            tasks = taskMapper.selectList(null);
        }

        Writer writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
        // Write BOM for Excel compatibility
        writer.write('﻿');
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader(TASK_HEADERS)
                .build();
        try (CSVPrinter printer = new CSVPrinter(writer, format)) {
            for (Task t : tasks) {
                printer.printRecord(
                        t.getTaskNo(),
                        t.getTitle(),
                        t.getType(),
                        t.getStatus(),
                        t.getAssigneeId(),
                        t.getProgress(),
                        t.getPlannedStart(),
                        t.getPlannedEnd(),
                        t.getActualStart(),
                        t.getActualEnd()
                );
            }
        }
        log.info("Exported {} tasks (projectId={})", tasks.size(), projectId);
    }

    public void exportProjects(OutputStream out) throws IOException {
        List<Project> projects = projectMapper.selectList(null);

        Writer writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
        writer.write('﻿');
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader(PROJECT_HEADERS)
                .build();
        try (CSVPrinter printer = new CSVPrinter(writer, format)) {
            for (Project p : projects) {
                printer.printRecord(
                        p.getCode(),
                        p.getName(),
                        p.getStatus(),
                        p.getOwnerId(),
                        p.getPlannedStart(),
                        p.getPlannedEnd()
                );
            }
        }
        log.info("Exported {} projects", projects.size());
    }
}
