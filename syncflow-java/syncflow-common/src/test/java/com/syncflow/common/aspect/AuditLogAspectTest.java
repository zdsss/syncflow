package com.syncflow.common.aspect;

import com.syncflow.common.annotation.Auditable;
import com.syncflow.common.util.SecurityUtils;
import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.annotation.Annotation;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuditLogAspect")
class AuditLogAspectTest {

    @Mock
    private ProceedingJoinPoint joinPoint;

    private final AuditLogAspect aspect = new AuditLogAspect();

    @AfterEach
    void cleanup() {
        SecurityUtils.clear();
    }

    @Test
    @DisplayName("audit: returns joinPoint result on success")
    void audit_success() throws Throwable {
        SecurityUtils.setCurrentUser(1L, "admin");
        when(joinPoint.proceed()).thenReturn("result");

        Auditable auditable = buildAuditable("CREATE_PROJECT", "Project");
        Object result = aspect.audit(joinPoint, auditable);

        assertEquals("result", result);
        verify(joinPoint).proceed();
    }

    @Test
    @DisplayName("audit: rethrows exception after logging")
    void audit_failure() throws Throwable {
        SecurityUtils.setCurrentUser(1L, "admin");
        when(joinPoint.proceed()).thenThrow(new RuntimeException("boom"));

        Auditable auditable = buildAuditable("DELETE_TASK", "Task");

        assertThrows(RuntimeException.class, () -> aspect.audit(joinPoint, auditable));
    }

    @Test
    @DisplayName("audit: works without authenticated user")
    void audit_noUser() throws Throwable {
        when(joinPoint.proceed()).thenReturn(null);

        Auditable auditable = buildAuditable("VIEW_DASHBOARD", "Dashboard");
        assertDoesNotThrow(() -> aspect.audit(joinPoint, auditable));
    }

    /** Build a real Auditable annotation instance without Mockito (avoids Java 25 mock-annotation issue). */
    private Auditable buildAuditable(String action, String targetType) {
        return new Auditable() {
            @Override
            public String action() { return action; }

            @Override
            public String targetType() { return targetType; }

            @Override
            public Class<? extends Annotation> annotationType() { return Auditable.class; }
        };
    }
}
