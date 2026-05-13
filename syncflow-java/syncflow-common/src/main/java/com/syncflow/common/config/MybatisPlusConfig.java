package com.syncflow.common.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.TenantLineInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.handler.TenantLineHandler;
import com.syncflow.common.util.TenantContext;
import net.sf.jsqlparser.expression.Expression;
import net.sf.jsqlparser.expression.LongValue;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * MyBatis-Plus configuration.
 * <ul>
 *   <li>Tenant row-level isolation interceptor (auto-appends {@code WHERE tenant_id})</li>
 *   <li>Pagination interceptor (PostgreSQL)</li>
 *   <li>Optimistic-locking interceptor (requires a {@code @Version} field)</li>
 *   <li>Auto-fill handler for {@code createdAt} / {@code updatedAt}</li>
 * </ul>
 */
@Configuration
public class MybatisPlusConfig {

    /**
     * Tables that do NOT have a {@code tenant_id} column and must be
     * excluded from automatic tenant filtering.
     */
    private static final Set<String> TENANT_EXCLUDE_TABLES = new HashSet<>(Arrays.asList(
            // System tables without tenant_id
            "sys_department",
            "sys_user",
            "sys_user_role",
            "sys_permission",
            // Project child tables (scoped via parent project)
            "prj_phase",
            "prj_stage_gate",
            "prj_milestone",
            "prj_project_member",
            // Task child tables
            "tsk_task_participant",
            "tsk_task_watcher",
            "tsk_task_comment",
            "tsk_task_activity",
            // BOM child tables
            "bom_item",
            "bom_version",
            // Process child tables
            "prc_operation",
            "prc_man_hour",
            "prc_operation_material",
            // Config tables (shared, not tenant-scoped)
            "cfg_module_category",
            "cfg_module",
            "cfg_module_spec",
            "cfg_spec_param",
            "cfg_order_category",
            "cfg_order_product",
            "cfg_product_bom",
            // Statistics tables
            "sta_dashboard_data",
            "sta_task_statistics",
            "sta_man_hour_ranking",
            // Notification tables (per-user, not per-tenant)
            "notification",
            "notification_setting",
            // Workflow tables without tenant_id
            "wf_approval_config",
            "wf_delegation",
            "wf_cc_record",
            "wf_approval_comment",
            // Sequence table (shared)
            "biz_code_sequence",
            // File child table
            "fil_file_version"
    ));

    /**
     * Registers tenant, pagination, and optimistic-locking interceptors.
     * <p>
     * The tenant interceptor must be added <b>first</b> so that the
     * {@code WHERE tenant_id = ?} clause is appended before pagination
     * rewrites the SQL.
     */
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();

        // Tenant row-level isolation — first priority
        interceptor.addInnerInterceptor(new TenantLineInnerInterceptor(new TenantLineHandler() {
            @Override
            public Expression getTenantId() {
                Long tenantId = TenantContext.getTenantId();
                if (tenantId == null) {
                    // Return a sentinel that the interceptor treats as "skip"
                    return new LongValue(-1);
                }
                return new LongValue(tenantId);
            }

            @Override
            public String getTenantIdColumn() {
                return "tenant_id";
            }

            @Override
            public boolean ignoreTable(String tableName) {
                // Skip tenant filter when no tenant context (e.g. login endpoint)
                if (TenantContext.getTenantId() == null) {
                    return true;
                }
                return TENANT_EXCLUDE_TABLES.contains(tableName);
            }
        }));

        // Pagination — detect PostgreSQL automatically
        PaginationInnerInterceptor paginationInterceptor = new PaginationInnerInterceptor(DbType.POSTGRE_SQL);
        paginationInterceptor.setMaxLimit(500L);
        interceptor.addInnerInterceptor(paginationInterceptor);

        // Optimistic locking
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());

        return interceptor;
    }

    /**
     * Auto-fill {@code createdAt} and {@code updatedAt} on insert / update.
     */
    @Component
    public static class SyncFlowMetaObjectHandler implements MetaObjectHandler {

        private static final String FIELD_CREATED_AT = "createdAt";
        private static final String FIELD_UPDATED_AT = "updatedAt";

        @Override
        public void insertFill(MetaObject metaObject) {
            LocalDateTime now = LocalDateTime.now();
            this.strictInsertFill(metaObject, FIELD_CREATED_AT, LocalDateTime.class, now);
            this.strictInsertFill(metaObject, FIELD_UPDATED_AT, LocalDateTime.class, now);
        }

        @Override
        public void updateFill(MetaObject metaObject) {
            this.strictUpdateFill(metaObject, FIELD_UPDATED_AT, LocalDateTime.class, LocalDateTime.now());
        }
    }
}
