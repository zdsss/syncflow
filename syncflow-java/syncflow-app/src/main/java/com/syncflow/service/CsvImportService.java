package com.syncflow.service;

import com.syncflow.task.entity.Task;
import com.syncflow.task.mapper.TaskMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * CSV import service for tasks.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class CsvImportService {

    private final TaskMapper taskMapper;

    public record ImportResult(int successCount, int errorCount, List<String> errors) {}

    @Transactional
    public ImportResult importTasks(Long projectId, InputStream in) throws IOException {
        Reader reader = new InputStreamReader(in, StandardCharsets.UTF_8);
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setTrim(true)
                .build();

        int success = 0;
        int errors = 0;
        List<String> errorMessages = new ArrayList<>();

        try (CSVParser parser = new CSVParser(reader, format)) {
            int rowNum = 1;
            for (CSVRecord record : parser) {
                rowNum++;
                try {
                    Task task = new Task();
                    task.setTitle(getField(record, "title"));
                    task.setType(getField(record, "type"));
                    task.setProjectId(projectId);

                    String statusStr = getField(record, "status");
                    if (statusStr != null && !statusStr.isEmpty()) {
                        task.setStatus(Integer.parseInt(statusStr));
                    } else {
                        task.setStatus(1);
                    }

                    String assigneeStr = getField(record, "assignee_id");
                    if (assigneeStr != null && !assigneeStr.isEmpty()) {
                        task.setAssigneeId(Long.parseLong(assigneeStr));
                    }

                    String startStr = getField(record, "planned_start");
                    if (startStr != null && !startStr.isEmpty()) {
                        task.setPlannedStart(LocalDate.parse(startStr));
                    }

                    String endStr = getField(record, "planned_end");
                    if (endStr != null && !endStr.isEmpty()) {
                        task.setPlannedEnd(LocalDate.parse(endStr));
                    }

                    taskMapper.insert(task);
                    success++;
                } catch (Exception e) {
                    errors++;
                    errorMessages.add("Row " + rowNum + ": " + e.getMessage());
                }
            }
        }

        log.info("Imported tasks (projectId={}): {} success, {} errors", projectId, success, errors);
        return new ImportResult(success, errors, errorMessages);
    }

    private String getField(CSVRecord record, String name) {
        try {
            String val = record.get(name);
            return (val != null && !val.isEmpty()) ? val : null;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
