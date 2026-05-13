package com.syncflow.common;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration for tests.
 * <p>
 * Registered only when the {@code test} profile is active.  Defines a
 * {@link SecurityFilterChain} with {@code @Order(1)} so it takes precedence
 * over the production {@code SecurityConfig} (which has default order).
 * <p>
 * All requests are permitted; no JWT filter is applied.  This allows
 * controller and integration tests to call API endpoints without
 * obtaining a valid token first.
 * <p>
 * The {@code PasswordEncoder} bean is intentionally not redefined here;
 * the production {@code SecurityConfig}'s bean is reused to avoid
 * {@link org.springframework.beans.factory.support.BeanDefinitionOverrideException}.
 * <p>
 * Tests that need to verify authentication/authorisation behaviour should
 * use {@code @WithMockUser} or set up the {@code SecurityContext} manually.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@Profile("test")
public class TestSecurityConfig {

    /**
     * Permissive security filter chain for tests.
     * <p>
     * {@code @Order(1)} ensures this chain is evaluated before the
     * production chain (which registers the JWT filter).  Because this
     * chain permits all requests, the JWT filter is never reached.
     */
    @Bean
    @Order(1)
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll()
            );
        return http.build();
    }
}
