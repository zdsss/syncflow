package com.syncflow.common.config;

import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.TenantLineInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.handler.TenantLineHandler;
import com.syncflow.common.util.TenantContext;
import net.sf.jsqlparser.expression.LongValue;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.lang.reflect.Field;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(classes = com.syncflow.common.TestApplication.class)
@ActiveProfiles("test")
@DisplayName("MybatisPlusConfig Tenant Interceptor")
class MybatisPlusConfigTenantTest {

    @Autowired
    private MybatisPlusInterceptor mybatisPlusInterceptor;

    @AfterEach
    void cleanup() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("should have TenantLineInnerInterceptor registered")
    void shouldHaveTenantLineInnerInterceptor() throws Exception {
        List<?> innerInterceptors = getInnerInterceptors();
        boolean hasTenant = innerInterceptors.stream()
                .anyMatch(i -> i instanceof TenantLineInnerInterceptor);
        assertTrue(hasTenant, "TenantLineInnerInterceptor should be registered");
    }

    @Test
    @DisplayName("tenant interceptor should be added before pagination interceptor")
    void tenantInterceptorShouldBeFirst() throws Exception {
        List<?> innerInterceptors = getInnerInterceptors();
        assertFalse(innerInterceptors.isEmpty());
        assertInstanceOf(TenantLineInnerInterceptor.class, innerInterceptors.get(0),
                "TenantLineInnerInterceptor should be the first interceptor");
    }

    @Test
    @DisplayName("should return sentinel tenantId when TenantContext is empty")
    void shouldReturnNullWhenTenantContextEmpty() throws Exception {
        TenantLineHandler handler = getTenantHandler();
        var expr = handler.getTenantId();
        assertNotNull(expr, "Should return sentinel value when TenantContext is not set");
        assertInstanceOf(LongValue.class, expr);
        assertEquals(-1L, ((LongValue) expr).getValue(),
                "Should return -1 as sentinel when TenantContext is not set");
    }

    @Test
    @DisplayName("should return tenant ID as LongValue from TenantContext")
    void shouldReturnTenantIdFromContext() throws Exception {
        TenantContext.setTenantId(42L);
        TenantLineHandler handler = getTenantHandler();

        var expr = handler.getTenantId();
        assertNotNull(expr, "Expression should not be null");
        assertInstanceOf(LongValue.class, expr);
        assertEquals(42L, ((LongValue) expr).getValue());
    }

    @Test
    @DisplayName("should return tenant_id column name")
    void shouldReturnTenantIdColumn() throws Exception {
        TenantLineHandler handler = getTenantHandler();
        assertEquals("tenant_id", handler.getTenantIdColumn());
    }

    @Test
    @DisplayName("should ignore tables without tenant_id")
    void shouldIgnoreTablesWithoutTenantId() throws Exception {
        TenantLineHandler handler = getTenantHandler();

        assertTrue(handler.ignoreTable("sys_department"));
        assertTrue(handler.ignoreTable("sys_user"));
        assertTrue(handler.ignoreTable("sys_user_role"));
        assertTrue(handler.ignoreTable("sys_permission"));
        assertTrue(handler.ignoreTable("wf_approval_config"));
        assertTrue(handler.ignoreTable("prj_phase"));
        assertTrue(handler.ignoreTable("prj_stage_gate"));
        assertTrue(handler.ignoreTable("prj_milestone"));
        assertTrue(handler.ignoreTable("tsk_task_comment"));
        assertTrue(handler.ignoreTable("tsk_task_activity"));
        assertTrue(handler.ignoreTable("bom_item"));
        assertTrue(handler.ignoreTable("bom_version"));
        assertTrue(handler.ignoreTable("prc_operation"));
        assertTrue(handler.ignoreTable("notification"));
        assertTrue(handler.ignoreTable("biz_code_sequence"));
        assertTrue(handler.ignoreTable("cfg_module"));
    }

    @Test
    @DisplayName("should NOT ignore tables that have tenant_id")
    void shouldNotIgnoreTenantAwareTables() throws Exception {
        TenantContext.setTenantId(1L); // Must set tenant context for non-excluded tables
        TenantLineHandler handler = getTenantHandler();

        // sys_user is excluded (no tenant_id column in practice)
        assertFalse(handler.ignoreTable("sys_role"));
        assertFalse(handler.ignoreTable("prj_project"));
        assertFalse(handler.ignoreTable("tsk_task"));
        assertFalse(handler.ignoreTable("bom_bom"));
        assertFalse(handler.ignoreTable("fil_file"));
        assertFalse(handler.ignoreTable("prc_process_route"));
        assertFalse(handler.ignoreTable("wf_business_object"));
        assertFalse(handler.ignoreTable("wf_change_request"));
    }

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    @SuppressWarnings("unchecked")
    private List<?> getInnerInterceptors() throws Exception {
        Field field = MybatisPlusInterceptor.class.getDeclaredField("interceptors");
        field.setAccessible(true);
        return (List<?>) field.get(mybatisPlusInterceptor);
    }

    private TenantLineInnerInterceptor getTenantInterceptor() throws Exception {
        List<?> interceptors = getInnerInterceptors();
        return interceptors.stream()
                .filter(i -> i instanceof TenantLineInnerInterceptor)
                .map(i -> (TenantLineInnerInterceptor) i)
                .findFirst()
                .orElseThrow(() -> new AssertionError("TenantLineInnerInterceptor not found"));
    }

    private TenantLineHandler getTenantHandler() throws Exception {
        TenantLineInnerInterceptor interceptor = getTenantInterceptor();
        Field field = TenantLineInnerInterceptor.class.getDeclaredField("tenantLineHandler");
        field.setAccessible(true);
        return (TenantLineHandler) field.get(interceptor);
    }
}
