package com.syncflow.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("HelpController")
class HelpControllerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new HelpController()).build();
    }

    @Test
    @DisplayName("GET /api/help/api-overview returns version and modules")
    void apiOverview() throws Exception {
        mockMvc.perform(get("/api/help/api-overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value("1.0.0"))
                .andExpect(jsonPath("$.modules").isArray())
                .andExpect(jsonPath("$.modules.length()").value(11))
                .andExpect(jsonPath("$.apiDocsUrl").value("/doc.html"));
    }

    @Test
    @DisplayName("GET /api/help/faq returns non-empty FAQ list")
    void faq() throws Exception {
        mockMvc.perform(get("/api/help/faq"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(6))
                .andExpect(jsonPath("$[0].question").isNotEmpty())
                .andExpect(jsonPath("$[0].answer").isNotEmpty());
    }

    @Test
    @DisplayName("GET /api/help/changelog returns changelog entries")
    void changelog() throws Exception {
        mockMvc.perform(get("/api/help/changelog"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].version").value("1.0.0"))
                .andExpect(jsonPath("$[0].date").value("2026-05-09"));
    }
}
