package com.syncflow.common.aspect;

import com.syncflow.common.annotation.Auditable;
import com.syncflow.common.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * AOP aspect that logs audit events for methods annotated with {@link Auditable}.
 * <p>
 * Captures: userId, username, action, targetType, IP address, and execution time.
 * Audit entries are written to the application log; production deployments should
 * forward these to the {@code biz_audit_log} table via an async appender or
 * a dedicated AuditLogService.
 */
@Aspect
@Component
@Slf4j
public class AuditLogAspect {

    @Around("@annotation(auditable)")
    public Object audit(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        long start = System.currentTimeMillis();
        Long userId = SecurityUtils.tryGetUserId();
        String username = null;
        try {
            username = SecurityUtils.getUsername();
        } catch (Exception ignored) {
        }
        String ip = getClientIp();

        Object result;
        try {
            result = joinPoint.proceed();
        } catch (Throwable ex) {
            log.warn("AUDIT | user={}({}) | action={} | target={} | ip={} | status=FAILED | error={} | duration={}ms",
                    username, userId, auditable.action(), auditable.targetType(), ip,
                    ex.getMessage(), System.currentTimeMillis() - start);
            throw ex;
        }

        log.info("AUDIT | user={}({}) | action={} | target={} | ip={} | status=SUCCESS | duration={}ms",
                username, userId, auditable.action(), auditable.targetType(), ip,
                System.currentTimeMillis() - start);
        return result;
    }

    private String getClientIp() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest req = attrs.getRequest();
                String forwarded = req.getHeader("X-Forwarded-For");
                if (forwarded != null && !forwarded.isEmpty()) {
                    return forwarded.split(",")[0].trim();
                }
                return req.getRemoteAddr();
            }
        } catch (Exception ignored) {
        }
        return "unknown";
    }
}
