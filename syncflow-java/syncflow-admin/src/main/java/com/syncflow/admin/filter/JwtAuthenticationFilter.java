package com.syncflow.admin.filter;

import com.syncflow.admin.service.impl.AuthServiceImpl;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.common.util.TenantContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final AuthServiceImpl authService;

    public JwtAuthenticationFilter(AuthServiceImpl authService) {
        this.authService = authService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String token = extractToken(request);
            if (StringUtils.hasText(token)) {
                Claims claims = authService.parseToken(token);
                Long userId = claims.get("userId", Long.class);
                String username = claims.getSubject();
                Long tenantId = claims.get("tenantId", Long.class);
                SecurityUtils.setCurrentUser(userId, username);
                if (tenantId != null) {
                    TenantContext.setTenantId(tenantId);
                }
            }
        } catch (Exception e) {
            // Token invalid/expired — proceed without auth context
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            SecurityUtils.clear();
            TenantContext.clear();
        }
    }

    private String extractToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (StringUtils.hasText(bearer) && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
