package com.syncflow.workflow.controller.wf;

import com.syncflow.common.result.Result;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.workflow.dto.ApprovalCommentVO;
import com.syncflow.workflow.dto.ApprovalTaskVO;
import com.syncflow.workflow.dto.BusinessObjectVO;
import com.syncflow.workflow.dto.StartProcessDTO;
import com.syncflow.workflow.entity.CcRecord;
import com.syncflow.workflow.entity.Delegation;
import com.syncflow.workflow.service.CcRecordService;
import com.syncflow.workflow.service.DelegationService;
import com.syncflow.workflow.service.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * REST controller for the workflow / approval module.
 * <p>
 * Provides endpoints to start approval processes, complete tasks, query
 * pending tasks, view approval history, and withdraw approvals.
 */
@RestController
@RequestMapping("/api/wf")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;
    private final DelegationService delegationService;
    private final CcRecordService ccRecordService;

    /**
     * Start an approval process for a business object.
     */
    @PostMapping("/start")
    public Result<Long> startProcess(@Valid @RequestBody StartProcessDTO dto) {
        Long userId = SecurityUtils.getUserId();
        Long businessObjectId = workflowService.startProcess(
                dto.getProcessKey(),
                dto.getObjectId(),
                dto.getObjectType(),
                dto.getObjectName(),
                dto.getProjectId(),
                userId,
                dto.getCcUserIds()
        );
        return Result.success(businessObjectId);
    }

    /**
     * Complete an approval task (approve or reject).
     */
    @PostMapping("/tasks/{taskId}/complete")
    public Result<Void> completeTask(@PathVariable String taskId,
                                     @RequestBody Map<String, Object> body) {
        Long userId = SecurityUtils.getUserId();
        boolean approved = Boolean.TRUE.equals(body.get("approved"));
        String comment = body.get("comment") != null ? body.get("comment").toString() : null;
        workflowService.completeTask(taskId, userId, approved, comment);
        return Result.success();
    }

    /**
     * Get pending approval tasks for the current user.
     */
    @GetMapping("/tasks/pending")
    public Result<List<ApprovalTaskVO>> getPendingTasks() {
        Long userId = SecurityUtils.getUserId();
        List<ApprovalTaskVO> tasks = workflowService.getPendingTasks(userId);
        return Result.success(tasks);
    }

    /**
     * Get completed/processed approval tasks for the current user.
     */
    @GetMapping("/tasks/completed")
    public Result<List<ApprovalTaskVO>> getCompletedTasks() {
        Long userId = SecurityUtils.getUserId();
        List<ApprovalTaskVO> tasks = workflowService.getCompletedTasks(userId);
        return Result.success(tasks);
    }

    /**
     * Get business object detail by id.
     */
    @GetMapping("/business-objects/{id}")
    public Result<BusinessObjectVO> getBusinessObject(@PathVariable Long id) {
        BusinessObjectVO vo = workflowService.getBusinessObject(id);
        return Result.success(vo);
    }

    /**
     * Get approval history for a business object.
     */
    @GetMapping("/business-objects/{id}/history")
    public Result<List<ApprovalCommentVO>> getApprovalHistory(@PathVariable Long id) {
        List<ApprovalCommentVO> history = workflowService.getApprovalHistory(id);
        return Result.success(history);
    }

    /**
     * Withdraw a pending approval.
     */
    @PostMapping("/business-objects/{id}/withdraw")
    public Result<Void> withdrawApproval(@PathVariable Long id) {
        Long userId = SecurityUtils.getUserId();
        workflowService.withdrawApproval(id, userId);
        return Result.success();
    }

    // -----------------------------------------------------------------------
    //  Delegation endpoints
    // -----------------------------------------------------------------------

    /**
     * Create an approval delegation.
     */
    @SuppressWarnings("unchecked")
    @PostMapping("/delegation")
    public Result<Void> delegate(@RequestBody Map<String, Object> body) {
        if (body.get("businessObjectId") == null || body.get("fromUserId") == null || body.get("toUserId") == null) {
            return Result.error(400, "businessObjectId, fromUserId, toUserId are required");
        }
        Long businessObjectId = ((Number) body.get("businessObjectId")).longValue();
        Long fromUserId = ((Number) body.get("fromUserId")).longValue();
        Long toUserId = ((Number) body.get("toUserId")).longValue();
        String reason = body.get("reason") != null ? body.get("reason").toString() : null;

        LocalDateTime startTime = body.get("startTime") != null
                ? LocalDateTime.parse(body.get("startTime").toString())
                : LocalDateTime.now();
        LocalDateTime endTime = body.get("endTime") != null
                ? LocalDateTime.parse(body.get("endTime").toString())
                : null;

        delegationService.delegate(businessObjectId, fromUserId, toUserId, reason, startTime, endTime);
        return Result.success();
    }

    /**
     * Revoke an approval delegation.
     */
    @DeleteMapping("/delegation/{id}")
    public Result<Void> revokeDelegation(@PathVariable Long id) {
        Long userId = SecurityUtils.getUserId();
        delegationService.revoke(id, userId);
        return Result.success();
    }

    /**
     * Get active delegations for the current user.
     */
    @GetMapping("/delegation")
    public Result<List<Delegation>> getDelegations() {
        Long userId = SecurityUtils.getUserId();
        List<Delegation> delegations = delegationService.getActiveDelegations(userId);
        return Result.success(delegations);
    }

    /**
     * Add a candidate user (加签) to the current active task.
     */
    @PostMapping("/tasks/{taskId}/add-candidate")
    public Result<Void> addCandidate(@PathVariable String taskId, @RequestBody Map<String, Object> body) {
        if (body.get("userId") == null) {
            return Result.error(400, "userId is required");
        }
        Long candidateUserId = ((Number) body.get("userId")).longValue();
        workflowService.addCandidateUser(taskId, candidateUserId);
        return Result.success();
    }

    /**
     * Reassign (transfer) an active task to a different user.
     */
    @PostMapping("/tasks/{taskId}/reassign")
    public Result<Void> reassignTask(@PathVariable String taskId, @RequestBody Map<String, Object> body) {
        if (body.get("userId") == null) {
            return Result.error(400, "userId is required");
        }
        Long newUserId = ((Number) body.get("userId")).longValue();
        workflowService.reassignTask(taskId, newUserId);
        return Result.success();
    }

    // -----------------------------------------------------------------------
    //  CC record endpoints
    // -----------------------------------------------------------------------

    /**
     * Add a CC record for a user on a business object.
     */
    @SuppressWarnings("unchecked")
    @PostMapping("/cc")
    public Result<Void> addCc(@RequestBody Map<String, Object> body) {
        if (body.get("businessObjectId") == null || body.get("userId") == null) {
            return Result.error(400, "businessObjectId and userId are required");
        }
        Long businessObjectId = ((Number) body.get("businessObjectId")).longValue();
        Long userId = ((Number) body.get("userId")).longValue();
        ccRecordService.addCc(businessObjectId, userId);
        return Result.success();
    }

    /**
     * Mark a CC record as read.
     */
    @PutMapping("/cc/{id}/read")
    public Result<Void> markCcAsRead(@PathVariable Long id) {
        Long userId = SecurityUtils.getUserId();
        ccRecordService.markAsRead(id, userId);
        return Result.success();
    }

    /**
     * Get CC records for the current user.
     */
    @GetMapping("/cc")
    public Result<List<CcRecord>> getCcRecords(
            @RequestParam(required = false, defaultValue = "false") boolean unreadOnly) {
        Long userId = SecurityUtils.getUserId();
        List<CcRecord> records = ccRecordService.getCcRecords(userId, unreadOnly);
        return Result.success(records);
    }

    @PostMapping("/business-objects/{id}/remind")
    public Result<Void> remindApproval(@PathVariable Long id) {
        Long userId = SecurityUtils.getUserId();
        workflowService.remindApproval(id, userId);
        return Result.success(null);
    }
}
