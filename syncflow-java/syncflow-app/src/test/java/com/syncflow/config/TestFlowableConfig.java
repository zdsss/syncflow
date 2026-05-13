package com.syncflow.config;

import org.flowable.engine.HistoryService;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * Provides mock Flowable engine services for tests.
 * <p>
 * Flowable 7.1.0's internal DDL scripts are incompatible with H2 2.x,
 * so the engine cannot fully initialise against an H2 database.
 * This configuration supplies Mockito mocks for the four core Flowable
 * services that application code depends on, allowing the Spring context
 * to boot without a running Flowable engine.
 * <p>
 * Tests that need to verify workflow behaviour should stub these mocks
 * explicitly with {@code Mockito.when(...)} or {@code Mockito.verify(...)}.
 */
@TestConfiguration
public class TestFlowableConfig {

    @Bean
    @Primary
    public RuntimeService runtimeService() {
        return Mockito.mock(RuntimeService.class);
    }

    @Bean
    @Primary
    public TaskService taskService() {
        return Mockito.mock(TaskService.class);
    }

    @Bean
    @Primary
    public HistoryService historyService() {
        return Mockito.mock(HistoryService.class);
    }

    @Bean
    @Primary
    public RepositoryService repositoryService() {
        return Mockito.mock(RepositoryService.class);
    }
}
