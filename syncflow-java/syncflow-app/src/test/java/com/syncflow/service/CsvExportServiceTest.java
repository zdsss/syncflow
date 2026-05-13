package com.syncflow.service;

import com.syncflow.project.entity.Project;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.task.entity.Task;
import com.syncflow.task.mapper.TaskMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CsvExportService")
class CsvExportServiceTest {

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private ProjectMapper projectMapper;

    @InjectMocks
    private CsvExportService csvExportService;

    @Test
    @DisplayName("exportTasks: produces CSV with header and rows")
    void exportTasks() throws Exception {
        Task t = new Task();
        t.setTaskNo("TSK-001");
        t.setTitle("Test Task");
        t.setType("TASK");
        t.setStatus(2);
        t.setAssigneeId(1L);
        t.setProgress(50);
        t.setPlannedStart(LocalDate.of(2026, 1, 1));
        t.setPlannedEnd(LocalDate.of(2026, 6, 30));

        when(taskMapper.selectList(any())).thenReturn(List.of(t));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        csvExportService.exportTasks(1L, out);

        String csv = out.toString("UTF-8");
        assertTrue(csv.contains("task_no"));
        assertTrue(csv.contains("TSK-001"));
        assertTrue(csv.contains("Test Task"));
        verify(taskMapper).selectList(any());
    }

    @Test
    @DisplayName("exportTasks: with null projectId exports all tasks")
    void exportTasks_allProjects() throws Exception {
        when(taskMapper.selectList(any())).thenReturn(List.of());

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        csvExportService.exportTasks(null, out);

        String csv = out.toString("UTF-8");
        assertTrue(csv.contains("task_no"));
        verify(taskMapper).selectList(any());
    }

    @Test
    @DisplayName("exportProjects: produces CSV with header and rows")
    void exportProjects() throws Exception {
        Project p = new Project();
        p.setCode("PRJ-001");
        p.setName("Test Project");
        p.setStatus(2);
        p.setOwnerId(1L);
        p.setPlannedStart(LocalDate.of(2026, 1, 1));
        p.setPlannedEnd(LocalDate.of(2026, 12, 31));

        when(projectMapper.selectList(any())).thenReturn(List.of(p));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        csvExportService.exportProjects(out);

        String csv = out.toString("UTF-8");
        assertTrue(csv.contains("code"));
        assertTrue(csv.contains("PRJ-001"));
        assertTrue(csv.contains("Test Project"));
    }

    @Test
    @DisplayName("exportProjects: handles empty list")
    void exportProjects_empty() throws Exception {
        when(projectMapper.selectList(any())).thenReturn(List.of());

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        csvExportService.exportProjects(out);

        String csv = out.toString("UTF-8");
        assertTrue(csv.contains("code"));
    }
}
