package com.syncflow.admin;

import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Minimal Spring Boot configuration for {@code @WebMvcTest} tests.
 * Enables component scanning within the {@code com.syncflow.admin} package so
 * that controllers, services (for mocking), and the GlobalExceptionHandler
 * (from syncflow-common) are discovered.
 */
@SpringBootApplication
public class TestApplication {
}
