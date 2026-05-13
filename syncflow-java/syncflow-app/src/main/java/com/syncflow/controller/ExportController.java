package com.syncflow.controller;

import com.syncflow.service.CsvExportService;
import com.syncflow.service.CsvImportService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ExportController {

    private final CsvExportService csvExportService;
    private final CsvImportService csvImportService;

    @GetMapping("/export/tasks")
    public void exportTasks(@RequestParam(required = false) Long projectId,
                            HttpServletResponse response) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition",
                "attachment; filename=" + (projectId != null ? "tasks_" + projectId : "tasks") + ".csv");
        csvExportService.exportTasks(projectId, response.getOutputStream());
    }

    @GetMapping("/export/projects")
    public void exportProjects(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=projects.csv");
        csvExportService.exportProjects(response.getOutputStream());
    }

    @PostMapping("/import/tasks")
    public CsvImportService.ImportResult importTasks(
            @RequestParam Long projectId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return csvImportService.importTasks(projectId, file.getInputStream());
    }
}
