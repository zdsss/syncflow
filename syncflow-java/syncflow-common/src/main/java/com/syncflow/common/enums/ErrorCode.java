package com.syncflow.common.enums;

/**
 * Centralised error codes for SyncFlow.
 * <p>
 * Code ranges are partitioned by domain to make log triage easier:
 * <ul>
 *   <li>{@code 200}      — success</li>
 *   <li>{@code 40xxx}    — parameter / bad-request</li>
 *   <li>{@code 401xx}    — authentication</li>
 *   <li>{@code 403xx}    — authorisation / forbidden</li>
 *   <li>{@code 404xx}    — resource not found (generic)</li>
 *   <li>{@code 50xxx}    — system / server</li>
 *   <li>{@code 101xx}    — auth module</li>
 *   <li>{@code 201xx}    — project module</li>
 *   <li>{@code 301xx}    — task module</li>
 *   <li>{@code 401xx}    — BOM module</li>
 *   <li>{@code 501xx}    — approval module</li>
 *   <li>{@code 601xx}    — file module</li>
 *   <li>{@code 701xx}    — config / spec module</li>
 * </ul>
 */
public enum ErrorCode {

    // ---- Generic -----------------------------------------------------------
    SUCCESS(200, "success"),
    SYSTEM_ERROR(50000, "Internal server error"),
    PARAM_ERROR(40000, "Invalid parameter"),
    UNAUTHORIZED(40100, "Unauthorized"),
    FORBIDDEN(40300, "Forbidden"),
    NOT_FOUND(40400, "Resource not found"),

    // ---- Auth module -------------------------------------------------------
    AUTH_LOGIN_FAILED(10101, "Login failed"),
    AUTH_TOKEN_EXPIRED(10102, "Token has expired"),
    USER_NOT_FOUND(10103, "User not found"),
    USERNAME_ALREADY_EXISTS(10104, "Username already exists"),
    USERNAME_OR_PASSWORD_ERROR(10105, "Username or password is incorrect"),
    USER_DISABLED(10106, "User account is disabled"),
    TOKEN_INVALID(10107, "Token is invalid"),

    // ---- Project module ----------------------------------------------------
    PROJECT_NOT_FOUND(20101, "Project not found"),
    PHASE_NOT_FOUND(20102, "Phase not found"),
    PROJECT_CODE_EXISTS(20103, "Project code already exists"),
    MILESTONE_NOT_FOUND(20104, "Milestone not found"),
    PROJECT_HAS_CHILDREN(20105, "Cannot delete project with child projects"),
    PROJECT_HAS_ACTIVE_TASKS(20108, "Cannot delete project with active tasks"),
    PROJECT_HAS_PENDING_APPROVALS(20109, "Cannot delete project with pending approvals"),
    PHASE_HAS_MILESTONES(20106, "Cannot delete phase with milestones"),
    MEMBER_ALREADY_EXISTS(20107, "Member already exists in project"),

    // ---- Task module -------------------------------------------------------
    TASK_NOT_FOUND(30101, "Task not found"),
    TASK_CANNOT_COMPLETE(30102, "Task cannot be completed in its current state"),
    TASK_INVALID_STATUS_TRANSITION(30103, "Invalid task status transition"),

    // ---- Task dependency module (v3) -----------------------------------------
    DEPENDENCY_SELF(30201, "Cannot create self-dependency"),
    DEPENDENCY_CROSS_PROJECT(30202, "Tasks must be in the same project"),
    DEPENDENCY_DUPLICATE(30203, "Dependency already exists"),
    DEPENDENCY_CYCLE(30204, "Adding this dependency would create a cycle"),
    DEPENDENCY_NOT_FOUND(30205, "Dependency not found"),
    DEPENDENCY_FORBIDDEN(30206, "Only the creator can delete this dependency"),
    DEPENDENCY_INVALID_TYPE(30207, "Invalid dependency type"),

    // ---- Task template module (v3) -------------------------------------------
    TASK_TEMPLATE_NOT_FOUND(30301, "Task template not found"),

    // ---- BOM module --------------------------------------------------------
    BOM_NOT_FOUND(40101, "BOM not found"),
    BOM_HAS_ITEMS(40102, "BOM still contains items"),
    BOM_PENDING_APPROVAL(40103, "BOM is pending approval"),
    BOM_ALREADY_PUBLISHED(40104, "BOM has already been published"),
    BOM_CANNOT_MODIFY(40105, "Published or locked BOM cannot be modified directly"),
    BOM_CHANGE_SUBMITTED(40106, "Change submitted for approval"),

    // ---- Approval module ---------------------------------------------------
    APPROVAL_TASK_NOT_FOUND(50101, "Approval task not found"),
    APPROVAL_ALREADY_DONE(50102, "Approval has already been processed"),

    // ---- Workflow template module (v3) ---------------------------------------
    WORKFLOW_TEMPLATE_NOT_FOUND(50201, "Workflow template not found"),

    // ---- File module -------------------------------------------------------
    FILE_NOT_FOUND(60101, "File not found"),
    FILE_LOCKED(60102, "File is locked"),

    // ---- Config / Spec module ----------------------------------------------
    SPEC_NOT_FOUND(70101, "Specification not found"),
    SPEC_PUBLISHED(70102, "Specification is already published"),

    // ---- Deliverable template module (v3) ------------------------------------
    DELIVERABLE_TEMPLATE_NOT_FOUND(70201, "Deliverable template not found"),

    // ---- Notification module -----------------------------------------------
    NOTIFICATION_NOT_FOUND(80101, "Notification not found"),

    // ---- Knowledge module --------------------------------------------------
    ARTICLE_NOT_FOUND(90101, "Article not found"),
    COMMENT_NOT_FOUND(90102, "Comment not found"),

    // ---- Template module ---------------------------------------------------
    TEMPLATE_NOT_FOUND(90201, "Template not found"),

    // ---- Personal module ---------------------------------------------------
    PERSONAL_FILE_NOT_FOUND(90301, "Personal file not found"),
    NOTE_NOT_FOUND(90302, "Note not found"),

    // ---- Resource module ---------------------------------------------------
    RESOURCE_NOT_FOUND(90401, "Resource not found"),

    // ---- RBAC module -------------------------------------------------------
    ROLE_NOT_FOUND(10201, "Role not found"),
    DEPARTMENT_NOT_FOUND(10202, "Department not found"),
    PERMISSION_NOT_FOUND(10203, "Permission not found"),
    OLD_PASSWORD_ERROR(10204, "Old password is incorrect");

    // -----------------------------------------------------------------------

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
