package com.syncflow.common.config;

import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Ensures the Java 8 date/time module is always registered with Jackson.
 * <p>
 * Spring Boot auto-detects {@code jackson-datatype-jsr310} when the jar is on
 * the classpath, but the {@code spring.jackson.date-format} property can
 * suppress that detection. This customizer guarantees {@link JavaTimeModule}
 * is registered regardless of YAML-level overrides.
 */
@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer javaTimeCustomizer() {
        return builder -> {
            builder.modules(new JavaTimeModule());
            builder.featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        };
    }
}
