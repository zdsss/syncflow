package com.syncflow.admin.filter;

import com.syncflow.admin.service.impl.AuthServiceImpl;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.common.util.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("JwtAuthenticationFilter — Tenant Context")
class JwtAuthenticationFilterTenantTest {

    @Mock
    private AuthServiceImpl authService;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @AfterEach
    void cleanup() {
        SecurityUtils.clear();
        TenantContext.clear();
    }

    @Test
    @DisplayName("should set tenant context from JWT tenantId claim")
    void shouldSetTenantContextFromJwtTenantIdClaim() throws Exception {
        io.jsonwebtoken.Claims claims = io.jsonwebtoken.Jwts.claims()
                .add("userId", 1L)
                .add("tenantId", 42L)
                .subject("admin")
                .build();

        when(request.getHeader("Authorization")).thenReturn("Bearer valid.jwt.token");
        when(authService.parseToken("valid.jwt.token")).thenReturn(claims);

        // Capture tenantId inside the filter chain (before finally clears it)
        final Long[] capturedTenantId = {null};
        doAnswer(invocation -> {
            capturedTenantId[0] = TenantContext.getTenantId();
            return null;
        }).when(filterChain).doFilter(any(), any());

        filter.doFilterInternal(request, response, filterChain);

        assertEquals(42L, capturedTenantId[0]);
    }

    @Test
    @DisplayName("should set tenant context to null when claim missing")
    void shouldSetTenantContextToNullWhenClaimMissing() throws Exception {
        io.jsonwebtoken.Claims claims = io.jsonwebtoken.Jwts.claims()
                .add("userId", 1L)
                .subject("admin")
                .build();

        when(request.getHeader("Authorization")).thenReturn("Bearer valid.jwt.token");
        when(authService.parseToken("valid.jwt.token")).thenReturn(claims);

        filter.doFilterInternal(request, response, filterChain);

        assertNull(TenantContext.getTenantId(), "TenantContext should be null when no tenantId claim");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should clear tenant context after request completes")
    void shouldClearTenantContextAfterRequest() throws Exception {
        io.jsonwebtoken.Claims claims = io.jsonwebtoken.Jwts.claims()
                .add("userId", 1L)
                .add("tenantId", 42L)
                .subject("admin")
                .build();

        when(request.getHeader("Authorization")).thenReturn("Bearer valid.jwt.token");
        when(authService.parseToken("valid.jwt.token")).thenReturn(claims);

        filter.doFilterInternal(request, response, filterChain);

        // After the filter completes (finally block), TenantContext should be cleared
        assertNull(TenantContext.getTenantId(), "TenantContext should be cleared after filter");
    }

    @Test
    @DisplayName("should not set tenant context when no token present")
    void shouldNotSetTenantContextWhenNoToken() throws Exception {
        when(request.getHeader("Authorization")).thenReturn(null);

        filter.doFilterInternal(request, response, filterChain);

        assertNull(TenantContext.getTenantId());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("should clear tenant context even when filter chain throws")
    void shouldClearTenantContextEvenOnException() throws Exception {
        io.jsonwebtoken.Claims claims = io.jsonwebtoken.Jwts.claims()
                .add("userId", 1L)
                .add("tenantId", 42L)
                .subject("admin")
                .build();

        when(request.getHeader("Authorization")).thenReturn("Bearer valid.jwt.token");
        when(authService.parseToken("valid.jwt.token")).thenReturn(claims);
        doThrow(new RuntimeException("downstream error")).when(filterChain).doFilter(any(), any());

        assertThrows(RuntimeException.class,
                () -> filter.doFilterInternal(request, response, filterChain));

        assertNull(TenantContext.getTenantId(), "TenantContext should be cleared even after exception");
    }
}
