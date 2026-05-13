package com.syncflow.service;

import com.syncflow.task.entity.Task;
import com.syncflow.task.mapper.TaskMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CsvImportService")
class CsvImportServiceTest {

    @Mock
    private TaskMapper taskMapper;

    @InjectMocks
    private CsvImportService csvImportService;

    private InputStream csv(String content) {
        return new ByteArrayInputStream(content.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("importTasks: imports valid rows")
    void importTasks_valid() throws Exception {
        when(taskMapper.insert(any(Task.class))).thenReturn(1);

        String content = "title,type,status,assignee_id,planned_start,planned_end\n"
                + "Task 1,TASK,1,1,2026-01-01,2026-06-30\n"
                + "Task 2,MILESTONE,2,2,2026-02-01,2026-07-31\n";

        CsvImportService.ImportResult result = csvImportService.importTasks(1L, csv(content));

        assertEquals(2, result.successCount());
        assertEquals(0, result.errorCount());
        assertTrue(result.errors().isEmpty());
        verify(taskMapper, times(2)).insert(any(Task.class));
    }

    @Test
    @DisplayName("importTasks: handles empty CSV")
    void importTasks_empty() throws Exception {
        String content = "title,type,status\n";

        CsvImportService.ImportResult result = csvImportService.importTasks(1L, csv(content));

        assertEquals(0, result.successCount());
        assertEquals(0, result.errorCount());
        verify(taskMapper, never()).insert(any(Task.class));
    }

    @Test
    @DisplayName("importTasks: counts errors for invalid rows")
    void importTasks_errors() throws Exception {
        String content = "title,type,status,assignee_id\n"
                + "Good Task,TASK,1,1\n"
                + "Bad Task,TASK,not_a_number,1\n";

        when(taskMapper.insert(any(Task.class))).thenReturn(1);

        CsvImportService.ImportResult result = csvImportService.importTasks(1L, csv(content));

        assertEquals(1, result.successCount());
        assertEquals(1, result.errorCount());
        assertFalse(result.errors().isEmpty());
        assertTrue(result.errors().get(0).contains("Row 3"));
    }

    @Test
    @DisplayName("importTasks: sets default status=1 when missing")
    void importTasks_defaultStatus() throws Exception {
        when(taskMapper.insert(any(Task.class))).thenAnswer(invocation -> {
            Task task = invocation.getArgument(0);
            assertEquals(1, task.getStatus());
            return 1;
        });

        String content = "title,type\nNew Task,TASK\n";

        CsvImportService.ImportResult result = csvImportService.importTasks(1L, csv(content));

        assertEquals(1, result.successCount());
        assertEquals(0, result.errorCount());
    }
}
