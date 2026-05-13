package com.syncflow.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/help")
@Tag(name = "Help Center", description = "API documentation and help resources")
public class HelpController {

    @GetMapping("/api-overview")
    @Operation(summary = "Get API overview and available modules")
    public Map<String, Object> getApiOverview() {
        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("version", "1.0.0");
        overview.put("description", "SyncFlow 项目管理平台 API");
        overview.put("apiDocsUrl", "/doc.html");
        overview.put("swaggerUrl", "/v3/api-docs");

        List<Map<String, String>> modules = List.of(
                module("auth", "认证与授权", "/api/auth/**"),
                module("admin", "系统管理 (用户/角色/部门)", "/api/sys/**"),
                module("project", "项目管理", "/api/projects/**"),
                module("task", "任务管理", "/api/tasks/**"),
                module("bom", "BOM管理", "/api/bom/**"),
                module("process", "工艺路线", "/api/process/**"),
                module("config", "配置管理 (模块库/规格)", "/api/config/**"),
                module("file", "文件管理", "/api/files/**"),
                module("workflow", "审批流程", "/api/workflow/**"),
                module("statistics", "数据统计", "/api/dashboard/**"),
                module("notification", "消息通知", "/api/notifications/**")
        );
        overview.put("modules", modules);
        return overview;
    }

    @GetMapping("/faq")
    @Operation(summary = "Get frequently asked questions")
    public List<Map<String, String>> getFaq() {
        return List.of(
                faq("如何创建项目？", "通过 POST /api/projects 接口创建项目，需要提供项目名称、编码等基本信息。"),
                faq("如何提交审批？", "通过 POST /api/workflow/start 接口发起审批流程，指定 objectType 和 objectId。"),
                faq("如何上传文件？", "通过 POST /api/files/upload 接口上传文件，支持 multipart/form-data 格式。"),
                faq("如何管理BOM？", "BOM管理包括创建BOM、添加BOM项、版本管理和变更审批，相关接口在 /api/bom/ 下。"),
                faq("如何查看审批记录？", "通过 GET /api/workflow/approvals 查看审批列表，GET /api/workflow/approvals/{id} 查看详情。"),
                faq("通知如何工作？", "系统通过 WebSocket STOMP 实时推送通知，同时提供 REST 接口查询历史通知。")
        );
    }

    @GetMapping("/changelog")
    @Operation(summary = "Get API changelog")
    public List<Map<String, String>> getChangelog() {
        return List.of(
                entry("1.0.0", "2026-05-09", "初始版本：12个业务模块，114个API端点，WebSocket实时通知，审批工作流"),
                entry("1.0.0-beta", "2026-05-01", "Beta版本：核心功能上线，JWT认证，文件管理")
        );
    }

    private Map<String, String> module(String id, String name, String basePath) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("name", name);
        m.put("basePath", basePath);
        return m;
    }

    private Map<String, String> faq(String question, String answer) {
        Map<String, String> f = new LinkedHashMap<>();
        f.put("question", question);
        f.put("answer", answer);
        return f;
    }

    private Map<String, String> entry(String version, String date, String description) {
        Map<String, String> e = new LinkedHashMap<>();
        e.put("version", version);
        e.put("date", date);
        e.put("description", description);
        return e;
    }
}
