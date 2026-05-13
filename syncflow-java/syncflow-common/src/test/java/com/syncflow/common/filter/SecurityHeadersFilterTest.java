package com.syncflow.common.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("SecurityHeadersFilter")
class SecurityHeadersFilterTest {

    private final SecurityHeadersFilter filter = new SecurityHeadersFilter();

    @Test
    @DisplayName("adds all security headers to response")
    void addsSecurityHeaders() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, chain);

        assertEquals("nosniff", response.getHeader("X-Content-Type-Options"));
        assertEquals("DENY", response.getHeader("X-Frame-Options"));
        assertEquals("1; mode=block", response.getHeader("X-XSS-Protection"));
        assertEquals("max-age=31536000; includeSubDomains", response.getHeader("Strict-Transport-Security"));
        assertEquals("no-store, no-cache, must-revalidate", response.getHeader("Cache-Control"));
        assertEquals("no-cache", response.getHeader("Pragma"));
        assertEquals("default-src 'self'", response.getHeader("Content-Security-Policy"));
        verify(chain).doFilter(request, response);
    }

    @Test
    @DisplayName("calls filter chain")
    void callsFilterChain() throws ServletException, IOException {
        FilterChain chain = mock(FilterChain.class);
        filter.doFilterInternal(new MockHttpServletRequest(), new MockHttpServletResponse(), chain);
        verify(chain).doFilter(any(), any());
    }
}
