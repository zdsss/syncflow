package com.syncflow.workflow.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.workflow.dto.ApprovalCommentVO;
import com.syncflow.workflow.dto.ApprovalTaskVO;
import com.syncflow.workflow.dto.BusinessObjectVO;
import com.syncflow.workflow.entity.ApprovalComment;
import com.syncflow.workflow.entity.ApprovalConfig;
import com.syncflow.workflow.entity.BusinessObject;
import com.syncflow.workflow.mapper.ApprovalCommentMapper;
import com.syncflow.workflow.mapper.ApprovalConfigMapper;
import com.syncflow.workflow.mapper.BusinessObjectMapper;
import com.syncflow.workflow.mapper.CrossModuleMapper;
import com.syncflow.workflow.service.impl.WorkflowServiceImpl;
import org.flowable.engine.HistoryService;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.flowable.task.api.TaskQuery;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WorkflowService")
class WorkflowServiceTest {

    @Mock
    private RuntimeService runtimeService;

    @Mock
    private TaskService taskService;

    @Mock
    private RepositoryService repositoryService;

    @Mock
    private HistoryService historyService;

    @Mock
    private BusinessObjectMapper businessObjectMapper;

    @Mock
    private ApprovalCommentMapper approvalCommentMapper;

    @Mock
    private ApprovalConfigMapper approvalConfigMapper;

    @Mock
    private ApprovalAssigneeResolver assigneeResolver;

    @Mock
    private CcRecordService ccRecordService;

    @Mock
    private CrossModuleMapper crossModuleMapper;

    private WorkflowServiceImpl workflowService;

    @BeforeEach
    void setUp() {
        // Manually construct service (needed for Java 25 where @InjectMocks fails
        // with concrete @Mock dependencies like ApprovalAssigneeResolver)
        workflowService = new WorkflowServiceImpl(
                runtimeService, taskService, repositoryService, historyService,
                businessObjectMapper, approvalCommentMapper, approvalConfigMapper,
                assigneeResolver, crossModuleMapper, ccRecordService);
    }

    private BusinessObject buildBusinessObject(Long id, Integer status) {
        BusinessObject bo = new BusinessObject();
        bo.setId(id);
        bo.setObjectType("BOM");
        bo.setObjectId(100L);
        bo.setObjectName("Test BOM");
        bo.setProjectId(1L);
        bo.setStatus(status);
        bo.setCurrentTaskId("task-001");
        bo.setCurrentNode("Tech Review");
        bo.setFlowInstanceId("flow-instance-001");
        bo.setApplicantId(1L);
        bo.setAppliedAt(LocalDateTime.now());
        bo.setCreatedAt(LocalDateTime.now());
        bo.setUpdatedAt(LocalDateTime.now());
        return bo;
    }

    // -----------------------------------------------------------------------
    //  getBusinessObject
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getBusinessObject()")
    class GetBusinessObject {

        @Test
        @DisplayName("should return BusinessObjectVO when found")
        void shouldReturnBusinessObjectVO() {
            BusinessObject bo = buildBusinessObject(1L, 2);
            when(businessObjectMapper.selectById(1L)).thenReturn(bo);

            BusinessObjectVO result = workflowService.getBusinessObject(1L);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals("BOM", result.getObjectType());
            assertEquals("Test BOM", result.getObjectName());
            assertEquals(2, result.getStatus());
            assertEquals(1L, result.getApplicantId());
            verify(businessObjectMapper).selectById(1L);
        }

        @Test
        @DisplayName("should return null when not found")
        void shouldReturnNullWhenNotFound() {
            when(businessObjectMapper.selectById(999L)).thenReturn(null);

            BusinessObjectVO result = workflowService.getBusinessObject(999L);

            assertNull(result);
            verify(businessObjectMapper).selectById(999L);
        }
    }

    // -----------------------------------------------------------------------
    //  getApprovalHistory
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getApprovalHistory()")
    class GetApprovalHistory {

        @Test
        @DisplayName("should return approval comments for business object")
        void shouldReturnApprovalHistory() {
            ApprovalComment comment = new ApprovalComment();
            comment.setId(1L);
            comment.setBusinessObjectId(1L);
            comment.setNodeName("Tech Review");
            comment.setApproverName("Admin");
            comment.setAction("APPROVE");
            comment.setComment("Looks good");
            comment.setCreatedAt(LocalDateTime.now());

            when(approvalCommentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(comment));

            List<ApprovalCommentVO> result = workflowService.getApprovalHistory(1L);

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("Tech Review", result.get(0).getNodeName());
            assertEquals("APPROVE", result.get(0).getAction());
            assertEquals("Looks good", result.get(0).getComment());
            assertEquals("Admin", result.get(0).getApproverName());
            verify(approvalCommentMapper).selectList(any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("should return empty list when no history")
        void shouldReturnEmptyListWhenNoHistory() {
            when(approvalCommentMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());

            List<ApprovalCommentVO> result = workflowService.getApprovalHistory(1L);

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  completeTask
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("completeTask()")
    class CompleteTask {

        @Test
        @DisplayName("should complete approval task and record comment")
        void shouldCompleteApprovalTask() {
            BusinessObject bo = buildBusinessObject(1L, 2); // pending
            when(businessObjectMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(bo);
            when(approvalCommentMapper.insert(any(ApprovalComment.class))).thenReturn(1);

            workflowService.completeTask("task-001", 1L, true, "Approved");

            verify(approvalCommentMapper).insert(argThat((ApprovalComment ac) ->
                    "APPROVE".equals(ac.getAction()) && "Approved".equals(ac.getComment())
            ));
            verify(taskService).complete(eq("task-001"), anyMap());
        }

        @Test
        @DisplayName("should throw when business object not found for task")
        void shouldThrowWhenBusinessObjectNotFound() {
            when(businessObjectMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> workflowService.completeTask("task-999", 1L, true, "Comment"));
            assertTrue(ex.getMessage().contains("No business object found")
                    || ex.getMessage().contains("not found"));
        }

        @Test
        @DisplayName("should throw when approval already processed")
        void shouldThrowWhenAlreadyProcessed() {
            BusinessObject bo = buildBusinessObject(1L, 3); // already approved
            when(businessObjectMapper.selectOne(any(LambdaQueryWrapper.class))).thenReturn(bo);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> workflowService.completeTask("task-001", 1L, true, "Comment"));
            assertTrue(ex.getMessage().contains("already been processed")
                    || ex.getMessage().contains("already"));
        }
    }

    // -----------------------------------------------------------------------
    //  getPendingTasks
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getPendingTasks()")
    class GetPendingTasks {

        @Test
        @DisplayName("should return pending approval tasks for user")
        void shouldReturnPendingTasks() {
            TaskQuery taskQuery = mock(TaskQuery.class);
            when(taskService.createTaskQuery()).thenReturn(taskQuery);
            when(taskQuery.or()).thenReturn(taskQuery);
            when(taskQuery.taskAssignee(anyString())).thenReturn(taskQuery);
            when(taskQuery.taskCandidateUser(anyString())).thenReturn(taskQuery);
            when(taskQuery.endOr()).thenReturn(taskQuery);
            when(taskQuery.active()).thenReturn(taskQuery);
            when(taskQuery.orderByTaskCreateTime()).thenReturn(taskQuery);
            when(taskQuery.desc()).thenReturn(taskQuery);
            when(taskQuery.list()).thenReturn(Collections.emptyList());

            List<ApprovalTaskVO> result = workflowService.getPendingTasks(1L);

            assertNotNull(result);
            assertTrue(result.isEmpty());
            verify(taskService).createTaskQuery();
        }
    }

    // -----------------------------------------------------------------------
    //  withdrawApproval
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("withdrawApproval()")
    class WithdrawApproval {

        @Test
        @DisplayName("should withdraw pending approval")
        void shouldWithdrawApproval() {
            BusinessObject bo = buildBusinessObject(1L, 2); // pending
            when(businessObjectMapper.selectById(1L)).thenReturn(bo);
            when(businessObjectMapper.updateById(any(BusinessObject.class))).thenReturn(1);

            workflowService.withdrawApproval(1L, 1L);

            assertEquals(5, bo.getStatus()); // withdrawn
            assertNull(bo.getCurrentTaskId());
            assertNull(bo.getCurrentNode());
            assertNotNull(bo.getCompletedAt());
            assertEquals(1L, bo.getCompletedBy());
            verify(runtimeService).deleteProcessInstance("flow-instance-001", "withdrawn by applicant");
            verify(businessObjectMapper).updateById(bo);
        }

        @Test
        @DisplayName("should throw when business object not found")
        void shouldThrowWhenBusinessObjectNotFound() {
            when(businessObjectMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> workflowService.withdrawApproval(999L, 1L));
            assertTrue(ex.getMessage().contains("not found")
                    || ex.getMessage().contains("Business object not found"));
        }

        @Test
        @DisplayName("should throw when not the applicant")
        void shouldThrowWhenNotApplicant() {
            BusinessObject bo = buildBusinessObject(1L, 2);
            bo.setApplicantId(1L);
            when(businessObjectMapper.selectById(1L)).thenReturn(bo);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> workflowService.withdrawApproval(1L, 999L));
            assertTrue(ex.getMessage().contains("Only the applicant")
                    || ex.getMessage().contains("Forbidden")
                    || ex.getMessage().contains("forbidden"));
            verify(runtimeService, never()).deleteProcessInstance(anyString(), anyString());
        }

        @Test
        @DisplayName("should throw when approval not in pending state")
        void shouldThrowWhenNotPending() {
            BusinessObject bo = buildBusinessObject(1L, 3); // already approved
            bo.setApplicantId(1L);
            when(businessObjectMapper.selectById(1L)).thenReturn(bo);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> workflowService.withdrawApproval(1L, 1L));
            assertTrue(ex.getMessage().contains("Cannot withdraw")
                    || ex.getMessage().contains("already been processed")
                    || ex.getMessage().contains("already"));
            verify(runtimeService, never()).deleteProcessInstance(anyString(), anyString());
        }
    }

    // -----------------------------------------------------------------------
    //  startProcess (CC support)
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("startProcess() with CC")
    class StartProcessWithCc {

        @Test
        @DisplayName("should create CC records when ccUserIds provided")
        void shouldCreateCcRecords() {
            // Mock repository service query chain
            org.flowable.engine.repository.ProcessDefinitionQuery pdQuery =
                    mock(org.flowable.engine.repository.ProcessDefinitionQuery.class);
            when(repositoryService.createProcessDefinitionQuery()).thenReturn(pdQuery);
            when(pdQuery.processDefinitionKey(anyString())).thenReturn(pdQuery);
            when(pdQuery.latestVersion()).thenReturn(pdQuery);
            when(pdQuery.singleResult()).thenReturn(null);

            when(businessObjectMapper.insert(any(BusinessObject.class))).thenAnswer(invocation -> {
                BusinessObject bo = invocation.getArgument(0);
                bo.setId(100L);
                return 1;
            });

            ProcessInstance pi = mock(ProcessInstance.class);
            when(pi.getId()).thenReturn("flow-123");
            when(runtimeService.startProcessInstanceByKey(anyString(), anyString(), anyMap()))
                    .thenReturn(pi);

            org.flowable.task.api.TaskQuery tq = mock(org.flowable.task.api.TaskQuery.class);
            when(taskService.createTaskQuery()).thenReturn(tq);
            when(tq.processInstanceId(anyString())).thenReturn(tq);
            when(tq.active()).thenReturn(tq);
            when(tq.singleResult()).thenReturn(null);

            List<Long> ccUserIds = List.of(10L, 20L);
            Long boId = workflowService.startProcess(
                    "GENERIC_APPROVAL", 1L, "MILESTONE", "Test Milestone", 1L, 1L, ccUserIds);

            assertNotNull(boId);
            verify(ccRecordService).addCc(boId, 10L);
            verify(ccRecordService).addCc(boId, 20L);
        }

        @Test
        @DisplayName("should not call ccRecordService when ccUserIds is null")
        void shouldNotCreateCcWhenNull() {
            org.flowable.engine.repository.ProcessDefinitionQuery pdQuery =
                    mock(org.flowable.engine.repository.ProcessDefinitionQuery.class);
            when(repositoryService.createProcessDefinitionQuery()).thenReturn(pdQuery);
            when(pdQuery.processDefinitionKey(anyString())).thenReturn(pdQuery);
            when(pdQuery.latestVersion()).thenReturn(pdQuery);
            when(pdQuery.singleResult()).thenReturn(null);

            when(businessObjectMapper.insert(any(BusinessObject.class))).thenAnswer(invocation -> {
                BusinessObject bo = invocation.getArgument(0);
                bo.setId(100L);
                return 1;
            });

            ProcessInstance pi = mock(ProcessInstance.class);
            when(pi.getId()).thenReturn("flow-123");
            when(runtimeService.startProcessInstanceByKey(anyString(), anyString(), anyMap()))
                    .thenReturn(pi);

            org.flowable.task.api.TaskQuery tq = mock(org.flowable.task.api.TaskQuery.class);
            when(taskService.createTaskQuery()).thenReturn(tq);
            when(tq.processInstanceId(anyString())).thenReturn(tq);
            when(tq.active()).thenReturn(tq);
            when(tq.singleResult()).thenReturn(null);

            workflowService.startProcess("GENERIC_APPROVAL", 1L, "MILESTONE", "Test", 1L, 1L, null);

            verifyNoInteractions(ccRecordService);
        }
    }
}
