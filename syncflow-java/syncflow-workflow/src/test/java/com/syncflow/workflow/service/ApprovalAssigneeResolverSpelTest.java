package com.syncflow.workflow.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.workflow.entity.ApprovalConfig;
import com.syncflow.workflow.mapper.ApprovalConfigMapper;
import com.syncflow.workflow.mapper.CrossModuleMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ApprovalAssigneeResolver — SpEL dynamic resolution")
class ApprovalAssigneeResolverSpelTest {

    @Mock
    private ApprovalConfigMapper approvalConfigMapper;

    @Mock
    private CrossModuleMapper crossModuleMapper;

    @Mock
    private ApplicationContext applicationContext;

    @InjectMocks
    private ApprovalAssigneeResolver resolver;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(resolver, "applicationContext", applicationContext);
    }

    // -----------------------------------------------------------------------
    //  Helper
    // -----------------------------------------------------------------------

    private void stubDynamicConfig(String expression) {
        ApprovalConfig config = new ApprovalConfig();
        config.setObjectType("TASK");
        config.setProcessKey("task_approval");
        config.setNodeId("approval_1");
        config.setRuleType("DYNAMIC");
        config.setExpression(expression);
        when(approvalConfigMapper.selectOne(any(LambdaQueryWrapper.class)))
                .thenReturn(config);
    }

    // -----------------------------------------------------------------------
    //  Bean method calls
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("@bean.method(#var) — bean returns List<Long>")
    void resolveAssignees_expressionReturnsList() {
        stubDynamicConfig("@projectService.getProjectOwner(#applicantId)");

        ProjectService mockProjectService = new ProjectService();
        when(applicationContext.getBean("projectService"))
                .thenReturn(mockProjectService);

        List<Long> result = resolver.resolveAssignees(
                "TASK", "task_approval", "approval_1", 10L, 42L);

        assertEquals(List.of(42L), result);
    }

    private static class ProjectService {
        public List<Long> getProjectOwner(Long applicantId) {
            return List.of(applicantId);
        }
    }

    @Test
    @DisplayName("@bean.method('literal') — role-based lookup returns List<Long>")
    void resolveAssignees_roleLookup() {
        stubDynamicConfig("@userService.getUsersByRole('QUALITY_MANAGER')");

        UserService mockUserService = new UserService();
        when(applicationContext.getBean("userService"))
                .thenReturn(mockUserService);

        List<Long> result = resolver.resolveAssignees(
                "TASK", "task_approval", "approval_1", 10L, 42L);

        assertEquals(List.of(100L, 200L), result);
    }

    private static class UserService {
        public List<Long> getUsersByRole(String role) {
            return List.of(100L, 200L);
        }
    }

    @Test
    @DisplayName("@bean.method(#var) — department head lookup")
    void resolveAssignees_deptHeadLookup() {
        stubDynamicConfig("@departmentService.getDeptHead(#applicantId)");

        DepartmentService mockDeptService = new DepartmentService();
        when(applicationContext.getBean("departmentService"))
                .thenReturn(mockDeptService);

        List<Long> result = resolver.resolveAssignees(
                "TASK", "task_approval", "approval_1", 10L, 42L);

        assertEquals(List.of(999L), result);
    }

    private static class DepartmentService {
        public Long getDeptHead(Long applicantId) {
            return 999L;
        }
    }

    // -----------------------------------------------------------------------
    //  Null / empty expression
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("null expression → empty list")
    void resolveAssignees_nullExpression_returnsEmpty() {
        stubDynamicConfig(null);

        List<Long> result = resolver.resolveAssignees(
                "TASK", "task_approval", "approval_1", 10L, 42L);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("blank expression → empty list")
    void resolveAssignees_blankExpression_returnsEmpty() {
        stubDynamicConfig("   ");

        List<Long> result = resolver.resolveAssignees(
                "TASK", "task_approval", "approval_1", 10L, 42L);

        assertTrue(result.isEmpty());
    }

    // -----------------------------------------------------------------------
    //  Bean not found
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("unknown bean name → empty list, no exception")
    void resolveAssignees_unknownBean_returnsEmpty() {
        stubDynamicConfig("@nonExistentService.doSomething()");

        when(applicationContext.getBean("nonExistentService"))
                .thenThrow(new org.springframework.beans.factory.NoSuchBeanDefinitionException("nonExistentService"));

        List<Long> result = resolver.resolveAssignees(
                "TASK", "task_approval", "approval_1", 10L, 42L);

        assertTrue(result.isEmpty());
    }

    // -----------------------------------------------------------------------
    //  Bean method throws
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("bean method throws exception → empty list, no exception")
    void resolveAssignees_beanMethodThrows_returnsEmpty() {
        stubDynamicConfig("@projectService.getProjectOwner(#applicantId)");

        ThrowingService mockService = new ThrowingService();
        when(applicationContext.getBean("projectService"))
                .thenReturn(mockService);

        List<Long> result = resolver.resolveAssignees(
                "TASK", "task_approval", "approval_1", 10L, 42L);

        assertTrue(result.isEmpty());
    }

    private static class ThrowingService {
        public List<Long> getProjectOwner(Long applicantId) {
            throw new RuntimeException("Database down");
        }
    }

    // -----------------------------------------------------------------------
    //  Bean returns null
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("bean method returns null → empty list")
    void resolveAssignees_beanReturnsNull_returnsEmpty() {
        stubDynamicConfig("@projectService.getProjectOwner(#applicantId)");

        NullReturningService mockService = new NullReturningService();
        when(applicationContext.getBean("projectService"))
                .thenReturn(mockService);

        List<Long> result = resolver.resolveAssignees(
                "TASK", "task_approval", "approval_1", 10L, 42L);

        assertTrue(result.isEmpty());
    }

    private static class NullReturningService {
        public List<Long> getProjectOwner(Long applicantId) {
            return null;
        }
    }

    // -----------------------------------------------------------------------
    //  Bean returns single Long (not wrapped in list)
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("bean method returns single Long → wrapped in list")
    void resolveAssignees_beanReturnsSingleLong_wrappedInList() {
        stubDynamicConfig("@departmentService.getDeptHead(#applicantId)");

        SingleLongService mockService = new SingleLongService();
        when(applicationContext.getBean("departmentService"))
                .thenReturn(mockService);

        List<Long> result = resolver.resolveAssignees(
                "TASK", "task_approval", "approval_1", 10L, 42L);

        assertEquals(List.of(77L), result);
    }

    private static class SingleLongService {
        public Long getDeptHead(Long applicantId) {
            return 77L;
        }
    }

    // -----------------------------------------------------------------------
    //  Bean returns Collection (not List)
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("bean method returns Collection<Long> → converted to list")
    void resolveAssignees_beanReturnsCollection_convertedToList() {
        stubDynamicConfig("@userService.getUsersByRole('PM')");

        CollectionReturningService mockService = new CollectionReturningService();
        when(applicationContext.getBean("userService"))
                .thenReturn(mockService);

        List<Long> result = resolver.resolveAssignees(
                "TASK", "task_approval", "approval_1", 10L, 42L);

        assertEquals(2, result.size());
        assertTrue(result.containsAll(List.of(10L, 20L)));
    }

    private static class CollectionReturningService {
        public Collection<Long> getUsersByRole(String role) {
            return java.util.Set.of(10L, 20L);
        }
    }

    // -----------------------------------------------------------------------
    //  No matching config → empty list (not specific to SpEL, but good to verify)
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("no config found → empty list")
    void resolveAssignees_noConfig_returnsEmpty() {
        when(approvalConfigMapper.selectOne(any(LambdaQueryWrapper.class)))
                .thenReturn(null);

        List<Long> result = resolver.resolveAssignees(
                "TASK", "task_approval", "approval_1", 10L, 42L);

        assertTrue(result.isEmpty());
    }

    // -----------------------------------------------------------------------
    //  Multiple bean calls in one expression
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("expression with multiple bean calls → returns combined result")
    void resolveAssignees_multipleBeanCalls_returnsCombinedResult() {
        stubDynamicConfig("@userService.getApprover('PM')");

        MultiBeanService mockService = new MultiBeanService();
        when(applicationContext.getBean("userService"))
                .thenReturn(mockService);

        List<Long> result = resolver.resolveAssignees(
                "TASK", "task_approval", "approval_1", 10L, 42L);

        assertEquals(List.of(1L, 2L), result);
    }

    private static class MultiBeanService {
        public List<Long> getApprover(String role) {
            return List.of(1L, 2L);
        }
    }
}
