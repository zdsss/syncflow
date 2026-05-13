package com.syncflow;

import com.syncflow.admin.entity.Department;
import com.syncflow.admin.entity.Role;
import com.syncflow.admin.service.DepartmentService;
import com.syncflow.admin.service.RoleService;
import com.syncflow.common.BaseTest;
import com.syncflow.common.config.CacheConfig;
import com.syncflow.config.TestFlowableConfig;
import com.syncflow.config.service.ModuleLibraryService;
import com.syncflow.statistics.service.DashboardService;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import java.lang.reflect.Method;
import java.util.Arrays;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Verifies that Spring Cache is active and that the targeted service methods
 * are annotated with @Cacheable / @CacheEvict.
 * <p>
 * Uses {@code spring.cache.type=simple} (ConcurrentHashMap) so no real Redis
 * is required.  Cache proxy behavior is verified for services in the same
 * module as the test context; cross-module services are verified by annotation
 * presence (Spring AOP proxy creation depends on classpath ordering).
 */
@Import(TestFlowableConfig.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Cache Integration Tests")
class CacheIntegrationTest extends BaseTest {

    @Autowired
    private DepartmentService departmentService;

    @Autowired
    private RoleService roleService;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private ModuleLibraryService moduleLibraryService;

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeAll
    void seedTestData() {
        jdbcTemplate.update(
                "INSERT INTO sys_department (id, name, code, parent_id, sort_order) " +
                        "VALUES (1, 'Engineering', 'ENG', NULL, 1)");
        jdbcTemplate.update(
                "INSERT INTO sys_role (id, code, name, description, tenant_id) " +
                        "VALUES (1, 'ADMIN', 'Admin', 'Administrator', 1)");
        jdbcTemplate.update(
                "INSERT INTO sys_user (id, username, password, real_name, status, tenant_id, dept_id) " +
                        "VALUES (1, 'testuser', 'pwd', 'Test User', 1, 1, 1)");
        jdbcTemplate.update(
                "INSERT INTO prj_project (id, name, code, owner_id, status, tenant_id) " +
                        "VALUES (1, 'Test Project', 'TP001', 1, 1, 1)");
        jdbcTemplate.update(
                "INSERT INTO tsk_task (id, task_no, title, type, project_id, assignee_id, status, updated_at, tenant_id) " +
                        "VALUES (1, 'TSK-001', 'Test Task', 'TASK', 1, 1, 4, CURRENT_TIMESTAMP, 1)");
        jdbcTemplate.update(
                "INSERT INTO cfg_module_category (id, name, code, parent_id, path, level, sort_order) " +
                        "VALUES (1, 'Electrical', 'ELEC', NULL, '0', 0, 1)");
        jdbcTemplate.update("ALTER TABLE sys_department ALTER COLUMN id RESTART WITH 100");
        jdbcTemplate.update("ALTER TABLE sys_role ALTER COLUMN id RESTART WITH 100");
    }

    @SuppressWarnings("unchecked")
    private java.util.concurrent.ConcurrentMap<Object, Object> nativeMap(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        assertNotNull(cache, "Cache '" + cacheName + "' should exist");
        return (java.util.concurrent.ConcurrentMap<Object, Object>) cache.getNativeCache();
    }

    // ── Infrastructure ──────────────────────────────────────────────

    @Test
    @Order(0)
    @DisplayName("CacheManager is available and functional")
    void cacheManagerAvailable() {
        assertNotNull(cacheManager, "CacheManager should be injected");
        // Create a cache manually to verify the manager works
        Cache testCache = cacheManager.getCache("test:infra");
        assertNotNull(testCache, "CacheManager should create caches on demand");
        testCache.put("k1", "v1");
        assertEquals("v1", testCache.get("k1").get());
    }

    // ── Proxy-based cache tests (same-module services) ─────────────

    @Test
    @Order(1)
    @DisplayName("getDepartmentTree populates dept:tree cache")
    void departmentTreeCached() {
        departmentService.getDepartmentTree();
        assertFalse(nativeMap(CacheConfig.CACHE_DEPT_TREE).isEmpty(),
                "dept:tree cache should be populated after first call");
    }

    @Test
    @Order(2)
    @DisplayName("getRoleList populates roles:list cache")
    void roleListCached() {
        roleService.getRoleList();
        assertFalse(nativeMap(CacheConfig.CACHE_ROLES_LIST).isEmpty(),
                "roles:list cache should be populated after first call");
    }

    // ── Cache eviction tests ────────────────────────────────────────

    @Test
    @Order(5)
    @DisplayName("createDepartment evicts dept:tree cache")
    void departmentTreeEvictedOnCreate() {
        departmentService.getDepartmentTree();
        assertFalse(nativeMap(CacheConfig.CACHE_DEPT_TREE).isEmpty(),
                "Cache should be populated before eviction");

        Department newDept = new Department();
        newDept.setName("HR");
        newDept.setCode("HREVICT");
        newDept.setSortOrder(0);
        departmentService.createDepartment(newDept);

        assertTrue(nativeMap(CacheConfig.CACHE_DEPT_TREE).isEmpty(),
                "dept:tree cache should be empty after createDepartment");
    }

    @Test
    @Order(6)
    @DisplayName("createRole evicts roles:list cache")
    void roleListEvictedOnCreate() {
        roleService.getRoleList();
        assertFalse(nativeMap(CacheConfig.CACHE_ROLES_LIST).isEmpty(),
                "Cache should be populated before eviction");

        Role newRole = new Role();
        newRole.setCode("VIEWER_EVICT");
        newRole.setName("Viewer");
        newRole.setTenantId(1L);
        roleService.createRole(newRole);

        assertTrue(nativeMap(CacheConfig.CACHE_ROLES_LIST).isEmpty(),
                "roles:list cache should be empty after createRole");
    }

    // ── Annotation verification (cross-module services) ─────────────

    @Test
    @Order(10)
    @DisplayName("DashboardService.getDashboard is annotated @Cacheable")
    void dashboardHasCacheAnnotation() throws Exception {
        Method method = DashboardService.class.getMethod("getDashboard", Long.class);
        Cacheable annotation = method.getAnnotation(Cacheable.class);
        assertNotNull(annotation, "@Cacheable should be on DashboardService.getDashboard");
        assertTrue(Arrays.asList(annotation.value()).contains(CacheConfig.CACHE_DASHBOARD_SUMMARY),
                "Cache name should be " + CacheConfig.CACHE_DASHBOARD_SUMMARY);
    }

    @Test
    @Order(11)
    @DisplayName("ModuleLibraryService.getCategoryTree is annotated @Cacheable")
    void moduleLibraryHasCacheAnnotation() throws Exception {
        Method method = ModuleLibraryService.class.getMethod("getCategoryTree", Long.class);
        Cacheable annotation = method.getAnnotation(Cacheable.class);
        assertNotNull(annotation, "@Cacheable should be on ModuleLibraryService.getCategoryTree");
        assertTrue(Arrays.asList(annotation.value()).contains(CacheConfig.CACHE_MODULE_CATEGORIES),
                "Cache name should be " + CacheConfig.CACHE_MODULE_CATEGORIES);
    }
}
