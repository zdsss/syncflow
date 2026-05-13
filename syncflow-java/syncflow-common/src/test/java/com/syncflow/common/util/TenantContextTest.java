package com.syncflow.common.util;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("TenantContext")
class TenantContextTest {

    @AfterEach
    void cleanup() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("should set and get tenant ID")
    void shouldSetAndGetTenantId() {
        TenantContext.setTenantId(42L);
        assertEquals(42L, TenantContext.getTenantId());
    }

    @Test
    @DisplayName("should return null when no tenant is set")
    void shouldReturnNullWhenNoTenantSet() {
        assertNull(TenantContext.getTenantId());
    }

    @Test
    @DisplayName("should clear tenant context")
    void shouldClearTenantContext() {
        TenantContext.setTenantId(1L);
        TenantContext.clear();
        assertNull(TenantContext.getTenantId());
    }

    @Test
    @DisplayName("should allow overwriting tenant ID")
    void shouldAllowOverwritingTenantId() {
        TenantContext.setTenantId(1L);
        assertEquals(1L, TenantContext.getTenantId());

        TenantContext.setTenantId(2L);
        assertEquals(2L, TenantContext.getTenantId());
    }
}
