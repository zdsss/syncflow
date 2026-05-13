package com.syncflow.common.util;

/**
 * Thread-local tenant context for multi-tenant row-level isolation.
 * <p>
 * The tenant ID is extracted from the JWT token by the authentication filter
 * and stored here so that the MyBatis-Plus tenant interceptor can automatically
 * append {@code WHERE tenant_id = ?} to all queries.
 * <p>
 * The context is cleaned up by the filter after the request completes.
 */
public final class TenantContext {

    private static final ThreadLocal<Long> TENANT_ID_HOLDER = new ThreadLocal<>();

    private TenantContext() {
    }

    /**
     * Store the current tenant ID for this request thread.
     */
    public static void setTenantId(Long tenantId) {
        TENANT_ID_HOLDER.set(tenantId);
    }

    /**
     * Get the current tenant ID. Returns {@code null} if not set.
     */
    public static Long getTenantId() {
        return TENANT_ID_HOLDER.get();
    }

    /**
     * Remove the tenant ID from the current thread. Must be called in a
     * {@code finally} block to prevent leaks in servlet-container thread pools.
     */
    public static void clear() {
        TENANT_ID_HOLDER.remove();
    }
}
