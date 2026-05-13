package com.syncflow.workflow.controller.wf;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.workflow.dto.*;
import com.syncflow.workflow.entity.CcRecord;
import com.syncflow.workflow.entity.Delegation;
import com.syncflow.workflow.service.CcRecordService;
import com.syncflow.workflow.service.DelegationService;
import com.syncflow.workflow.service.WorkflowService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(WorkflowController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class WorkflowControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WorkflowService workflowService;

    @MockBean
    private DelegationService delegationService;

    @MockBean
    private CcRecordService ccRecordService;

    @BeforeEach
    void setUp() {
        SecurityUtils.setCurrentUser(1L, "admin");
    }

    @AfterEach
    void tearDown() {
        SecurityUtils.clear();
    }

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private ApprovalTaskVO buildApprovalTaskVO() {
        ApprovalTaskVO vo = new ApprovalTaskVO();
        vo.setTaskId("task-001");
        vo.setTaskName("Approve BOM");
        vo.setBusinessObjectId(1L);
        vo.setObjectType("BOM");
        vo.setObjectName("BOM v1");
        vo.setObjectCode("BOM-001");
        vo.setProjectId(20L);
        vo.setApplicantName("admin");
        vo.setCreatedAt(LocalDateTime.now());
        return vo;
    }

    private BusinessObjectVO buildBusinessObjectVO() {
        BusinessObjectVO vo = new BusinessObjectVO();
        vo.setId(1L);
        vo.setObjectType("BOM");
        vo.setObjectId(10L);
        vo.setObjectName("BOM v1");
        vo.setStatus(1);
        vo.setApplicantId(1L);
        vo.setApplicantName("admin");
        vo.setCreatedAt(LocalDateTime.now());
        return vo;
    }

    private ApprovalCommentVO buildApprovalCommentVO() {
        ApprovalCommentVO vo = new ApprovalCommentVO();
        vo.setId(1L);
        vo.setNodeName("Tech Lead Review");
        vo.setApproverName("admin");
        vo.setAction("APPROVE");
        vo.setComment("Looks good");
        vo.setCreatedAt(LocalDateTime.now());
        return vo;
    }

    private Delegation buildDelegation() {
        Delegation d = new Delegation();
        d.setId(1L);
        d.setBusinessObjectId(10L);
        d.setFromUserId(1L);
        d.setToUserId(2L);
        d.setReason("Vacation");
        d.setStartTime(LocalDateTime.now());
        d.setIsActive(true);
        d.setCreatedAt(LocalDateTime.now());
        return d;
    }

    private CcRecord buildCcRecord() {
        CcRecord cc = new CcRecord();
        cc.setId(1L);
        cc.setBusinessObjectId(10L);
        cc.setUserId(1L);
        cc.setIsRead(false);
        cc.setCreatedAt(LocalDateTime.now());
        return cc;
    }

    // -----------------------------------------------------------------------
    //  POST /api/wf/start
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/wf/start")
    class StartProcess {

        @Test
        @DisplayName("should start a new approval process")
        void shouldStartProcess() throws Exception {
            StartProcessDTO dto = new StartProcessDTO();
            dto.setProcessKey("bom-approval");
            dto.setObjectId(10L);
            dto.setObjectType("BOM");
            dto.setObjectName("BOM v1");
            dto.setProjectId(20L);

            when(workflowService.startProcess(
                    eq("bom-approval"), eq(10L), eq("BOM"), eq("BOM v1"),
                    eq(20L), eq(1L), eq(null)))
                    .thenReturn(100L);

            mockMvc.perform(post("/api/wf/start")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").value(100));
        }

        @Test
        @DisplayName("should return 400 when processKey is blank")
        void shouldReturn400WhenProcessKeyBlank() throws Exception {
            StartProcessDTO dto = new StartProcessDTO();
            dto.setProcessKey("");
            dto.setObjectId(10L);

            mockMvc.perform(post("/api/wf/start")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40000));
        }

        @Test
        @DisplayName("should return 400 when objectId is null")
        void shouldReturn400WhenObjectIdNull() throws Exception {
            StartProcessDTO dto = new StartProcessDTO();
            dto.setProcessKey("bom-approval");

            mockMvc.perform(post("/api/wf/start")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value(40000));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/wf/tasks/{taskId}/complete
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/wf/tasks/{taskId}/complete")
    class CompleteTask {

        @Test
        @DisplayName("should complete a task with approval")
        void shouldCompleteTask() throws Exception {
            Map<String, Object> body = Map.of("approved", true, "comment", "LGTM");

            mockMvc.perform(post("/api/wf/tasks/task-001/complete")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(workflowService).completeTask("task-001", 1L, true, "LGTM");
        }

        @Test
        @DisplayName("should complete a task with rejection")
        void shouldRejectTask() throws Exception {
            Map<String, Object> body = Map.of("approved", false, "comment", "Needs revision");

            mockMvc.perform(post("/api/wf/tasks/task-002/complete")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(workflowService).completeTask("task-002", 1L, false, "Needs revision");
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/wf/tasks/pending
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/wf/tasks/pending")
    class GetPendingTasks {

        @Test
        @DisplayName("should return pending tasks for current user")
        void shouldReturnPendingTasks() throws Exception {
            when(workflowService.getPendingTasks(1L))
                    .thenReturn(Collections.singletonList(buildApprovalTaskVO()));

            mockMvc.perform(get("/api/wf/tasks/pending"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].taskId").value("task-001"))
                    .andExpect(jsonPath("$.data[0].objectType").value("BOM"))
                    .andExpect(jsonPath("$.data[0].applicantName").value("admin"));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/wf/business-objects/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/wf/business-objects/{id}")
    class GetBusinessObject {

        @Test
        @DisplayName("should return business object detail")
        void shouldReturnBusinessObject() throws Exception {
            when(workflowService.getBusinessObject(1L))
                    .thenReturn(buildBusinessObjectVO());

            mockMvc.perform(get("/api/wf/business-objects/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.objectType").value("BOM"))
                    .andExpect(jsonPath("$.data.applicantName").value("admin"));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/wf/business-objects/{id}/history
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/wf/business-objects/{id}/history")
    class GetApprovalHistory {

        @Test
        @DisplayName("should return approval history for a business object")
        void shouldReturnApprovalHistory() throws Exception {
            when(workflowService.getApprovalHistory(1L))
                    .thenReturn(Collections.singletonList(buildApprovalCommentVO()));

            mockMvc.perform(get("/api/wf/business-objects/1/history"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].nodeName").value("Tech Lead Review"))
                    .andExpect(jsonPath("$.data[0].action").value("APPROVE"))
                    .andExpect(jsonPath("$.data[0].comment").value("Looks good"));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/wf/business-objects/{id}/withdraw
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/wf/business-objects/{id}/withdraw")
    class WithdrawApproval {

        @Test
        @DisplayName("should withdraw a pending approval")
        void shouldWithdrawApproval() throws Exception {
            mockMvc.perform(post("/api/wf/business-objects/1/withdraw"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(workflowService).withdrawApproval(1L, 1L);
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/wf/delegation
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/wf/delegation")
    class Delegate {

        @Test
        @DisplayName("should create a delegation")
        void shouldCreateDelegation() throws Exception {
            Map<String, Object> body = Map.of(
                    "businessObjectId", 10,
                    "fromUserId", 1,
                    "toUserId", 2,
                    "reason", "Vacation");

            mockMvc.perform(post("/api/wf/delegation")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(delegationService).delegate(
                    eq(10L), eq(1L), eq(2L), eq("Vacation"),
                    any(LocalDateTime.class), isNull());
        }
    }

    // -----------------------------------------------------------------------
    //  DELETE /api/wf/delegation/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/wf/delegation/{id}")
    class RevokeDelegation {

        @Test
        @DisplayName("should revoke a delegation")
        void shouldRevokeDelegation() throws Exception {
            mockMvc.perform(delete("/api/wf/delegation/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(delegationService).revoke(1L, 1L);
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/wf/delegation
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/wf/delegation")
    class GetDelegations {

        @Test
        @DisplayName("should return active delegations for current user")
        void shouldReturnDelegations() throws Exception {
            when(delegationService.getActiveDelegations(1L))
                    .thenReturn(Collections.singletonList(buildDelegation()));

            mockMvc.perform(get("/api/wf/delegation"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].fromUserId").value(1))
                    .andExpect(jsonPath("$.data[0].toUserId").value(2))
                    .andExpect(jsonPath("$.data[0].reason").value("Vacation"));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/wf/cc
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/wf/cc")
    class AddCc {

        @Test
        @DisplayName("should add a CC record")
        void shouldAddCc() throws Exception {
            Map<String, Object> body = Map.of(
                    "businessObjectId", 10,
                    "userId", 5);

            mockMvc.perform(post("/api/wf/cc")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(ccRecordService).addCc(10L, 5L);
        }
    }

    // -----------------------------------------------------------------------
    //  PUT /api/wf/cc/{id}/read
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PUT /api/wf/cc/{id}/read")
    class MarkCcAsRead {

        @Test
        @DisplayName("should mark CC record as read")
        void shouldMarkCcAsRead() throws Exception {
            mockMvc.perform(put("/api/wf/cc/1/read"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));

            verify(ccRecordService).markAsRead(1L, 1L);
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/wf/cc
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/wf/cc")
    class GetCcRecords {

        @Test
        @DisplayName("should return CC records with unreadOnly filter")
        void shouldReturnCcRecords() throws Exception {
            when(ccRecordService.getCcRecords(1L, true))
                    .thenReturn(Collections.singletonList(buildCcRecord()));

            mockMvc.perform(get("/api/wf/cc")
                            .param("unreadOnly", "true"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].businessObjectId").value(10))
                    .andExpect(jsonPath("$.data[0].isRead").value(false));
        }

        @Test
        @DisplayName("should return all CC records when unreadOnly is false")
        void shouldReturnAllCcRecords() throws Exception {
            when(ccRecordService.getCcRecords(1L, false))
                    .thenReturn(Collections.singletonList(buildCcRecord()));

            mockMvc.perform(get("/api/wf/cc"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray());
        }
    }
}
