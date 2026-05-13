package com.syncflow.workflow.config;

import com.syncflow.workflow.listener.ApprovalEventListener;
import lombok.RequiredArgsConstructor;
import org.flowable.spring.SpringProcessEngineConfiguration;
import org.flowable.spring.boot.EngineConfigurationConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Flowable engine configuration that registers the
 * {@link ApprovalEventListener} for workflow lifecycle events.
 * <p>
 * This ensures the listener receives events for task creation, task completion,
 * process completion, and process cancellation so that the
 * {@code wf_business_object} binding table stays in sync with the Flowable
 * runtime.
 */
@Configuration
@RequiredArgsConstructor
public class FlowableConfig {

    private final ApprovalEventListener approvalEventListener;

    /**
     * Configures the Flowable engine to register our custom event listener.
     *
     * @return engine configuration configurer
     */
    @Bean
    public EngineConfigurationConfigurer<SpringProcessEngineConfiguration> engineConfigurer() {
        return configuration -> {
            // Register the listener for task and process lifecycle events
            configuration.setEventListeners(
                    java.util.Collections.singletonList(approvalEventListener)
            );
        };
    }
}
