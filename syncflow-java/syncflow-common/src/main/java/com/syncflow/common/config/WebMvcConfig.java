package com.syncflow.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC configuration.
 * <p>
 * Enables CORS for the Vite dev-server ({@code localhost:5173}),
 * the Next.js dev-server ({@code localhost:3000}), and the production origin.
 * All API endpoints under {@code /api/**} accept standard CRUD methods
 * and common headers.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    /**
     * Allowed front-end origins.  Add production URLs here when deploying.
     */
    private static final String[] ALLOWED_ORIGINS = {
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
    };

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(ALLOWED_ORIGINS)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
