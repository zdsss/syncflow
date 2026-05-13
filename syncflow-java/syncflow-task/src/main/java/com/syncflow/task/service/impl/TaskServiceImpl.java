package com.syncflow.task.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.admin.entity.User;
import com.syncflow.admin.mapper.UserMapper;
import com.syncflow.common.mapper.BizCodeSequenceMapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.message.service.NotificationService;
import com.syncflow.project.entity.Project;
import com.syncflow.project.entity.ProjectPhase;
import com.syncflow.project.mapper.PhaseMapper;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.task.dto.*;
import com.syncflow.task.entity.Task;
import com.syncflow.task.entity.TaskActivity;
import com.syncflow.task.entity.TaskComment;
import com.syncflow.task.entity.TaskWatcher;
import com.syncflow.task.enums.TaskStatus;
import com.syncflow.task.enums.TaskType;
import com.syncflow.task.mapper.*;
import com.syncflow.task.service.TaskService;
import com.syncflow.workflow.service.WorkflowService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Task management service implementation.
 */
@Service
@Slf4j
public class TaskServiceImpl implements TaskService {

    private final TaskMapper taskMapper;
    private final TaskCommentMapper taskCommentMapper;
    private final TaskWatcherMapper taskWatcherMapper;
    private final TaskActivityMapper taskActivityMapper;
    private final TaskParticipantMapper taskParticipantMapper;
    private final TaskDependencyMapper taskDependencyMapper;
    private final ProjectMapper projectMapper;
    private final PhaseMapper phaseMapper;
    private final UserMapper userMapper;
    private final BizCodeSequenceMapper bizCodeSequenceMapper;

    private NotificationService notificationService;

    @Lazy
    private WorkflowService workflowService;

    @Autowired(required = false)
    public void setNotificationService(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Autowired
    public void setWorkflowService(@Lazy WorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    // Regex patterns for quick-create parsing
    private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\S+?)(?=[￥$%#,]|$)");
    private static final Pattern HOURS_PATTERN = Pattern.compile("[￥$](\\d+(?:\\.\\d+)?)");
    private static final Pattern DAYS_PATTERN = Pattern.compile("[￥$](\\d+)d");
    private static final Pattern TYPE_PATTERN = Pattern.compile("%(\\S+)");

    public TaskServiceImpl(TaskMapper taskMapper,
                           TaskCommentMapper taskCommentMapper,
                           TaskWatcherMapper taskWatcherMapper,
                           TaskActivityMapper taskActivityMapper,
                           TaskParticipantMapper taskParticipantMapper,
                           TaskDependencyMapper taskDependencyMapper,
                           ProjectMapper projectMapper,
                           PhaseMapper phaseMapper,
                           UserMapper userMapper,
                           BizCodeSequenceMapper bizCodeSequenceMapper) {
        this.taskMapper = taskMapper;
        this.taskCommentMapper = taskCommentMapper;
        this.taskWatcherMapper = taskWatcherMapper;
        this.taskActivityMapper = taskActivityMapper;
        this.taskParticipantMapper = taskParticipantMapper;
        this.taskDependencyMapper = taskDependencyMapper;
        this.projectMapper = projectMapper;
        this.phaseMapper = phaseMapper;
        this.userMapper = userMapper;
        this.bizCodeSequenceMapper = bizCodeSequenceMapper;
    }

    // -----------------------------------------------------------------------
    //  List & Statistics
    // -----------------------------------------------------------------------

    @Override
    public PageResult<TaskListVO> getTaskList(TaskQueryDTO query, int pageNum, int pageSize) {
        Page<TaskListVO> page = new Page<>(pageNum, pageSize);
        return PageResult.of(taskMapper.selectTaskPage(page, query));
    }

    @Override
    public TaskStatisticsVO getTaskStatistics(Long userId) {
        TaskStatisticsVO vo = new TaskStatisticsVO();

        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        LocalDate weekEnd = today.with(DayOfWeek.SUNDAY);
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        // Base wrapper scoped to user if provided
        LambdaQueryWrapper<Task> base = new LambdaQueryWrapper<>();
        if (userId != null) {
            base.eq(Task::getAssigneeId, userId);
        }

        // Today
        vo.setToday(countWith(base.clone().eq(Task::getDueDate, today)));

        // This week
        vo.setThisWeek(countWith(base.clone().between(Task::getDueDate, weekStart, weekEnd)));

        // This month
        vo.setThisMonth(countWith(base.clone().between(Task::getDueDate, monthStart, monthEnd)));

        // Total
        vo.setTotal(countWith(base.clone()));

        // Warning
        vo.setWarning(countWith(base.clone().eq(Task::getIsWarning, true)));

        // Overdue
        vo.setOverdue(countWith(base.clone().eq(Task::getIsOverdue, true)));

        // By type
        vo.setTaskCount(countWithType(base.clone(), TaskType.TASK));
        vo.setMilestoneCount(countWithType(base.clone(), TaskType.MILESTONE));
        vo.setIssueCount(countWithType(base.clone(), TaskType.ISSUE));
        vo.setRiskCount(countWithType(base.clone(), TaskType.RISK));
        vo.setSuggestionCount(countWithType(base.clone(), TaskType.SUGGESTION));
        vo.setChangeCount(countWithType(base.clone(), TaskType.CHANGE));
        vo.setActivityCount(countWithType(base.clone(), TaskType.ACTIVITY));
        vo.setStageCount(countWithType(base.clone(), TaskType.STAGE));

        // By type: APPROVAL
        vo.setApprovalCount(countWithType(base.clone(), TaskType.APPROVAL));

        // By status
        vo.setPendingCount(countWithStatus(base.clone(), TaskStatus.PENDING));
        vo.setInProgressCount(countWithStatus(base.clone(), TaskStatus.IN_PROGRESS));
        vo.setCompletedCount(countWithStatus(base.clone(), TaskStatus.COMPLETED));
        vo.setCancelledCount(countWithStatus(base.clone(), TaskStatus.CANCELLED));
        vo.setOnHoldCount(countWithStatus(base.clone(), TaskStatus.ON_HOLD));
        vo.setOverdueCount(countWithStatus(base.clone(), TaskStatus.OVERDUE));

        return vo;
    }

    // -----------------------------------------------------------------------
    //  Create
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public TaskVO createTask(CreateTaskDTO dto) {
        Long currentUserId = SecurityUtils.getUserId();

        // Validate projectId if provided
        Long projectId = dto.getProjectId();
        if (projectId != null && projectMapper.selectById(projectId) == null) {
            throw new BusinessException(ErrorCode.PROJECT_NOT_FOUND,
                    "Project not found: " + projectId);
        }

        Task task = new Task();
        task.setTaskNo(generateTaskNo());
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setType(dto.getType());
        task.setProjectId(projectId);
        task.setPhaseId(dto.getPhaseId());
        task.setMilestoneId(dto.getMilestoneId());
        task.setParentId(dto.getParentId());
        task.setAssigneeId(dto.getAssigneeId());
        task.setReporterId(currentUserId);
        task.setStatus(TaskStatus.PENDING.getCode());
        task.setProgress(0);
        task.setPlannedStart(dto.getPlannedStart());
        task.setPlannedEnd(dto.getPlannedEnd());
        task.setPlannedHours(dto.getPlannedHours());
        task.setPlannedDays(dto.getPlannedDays());
        task.setDueDate(dto.getDueDate());
        task.setTags(dto.getTags());
        task.setPriority(dto.getPriority() != null ? dto.getPriority() : 3); // default MEDIUM
        task.setCommentCount(0);
        task.setAttachmentCount(0);
        task.setWatcherCount(0);
        task.setIsOverdue(false);
        task.setIsWarning(false);

        taskMapper.insert(task);

        // Record activity
        recordActivity(task.getId(), currentUserId, "CREATED", null, null, null);

        return toTaskVO(task);
    }

    @Override
    @Transactional
    public TaskVO quickCreate(QuickTaskDTO dto) {
        String input = dto.getInput();
        if (input == null || input.isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "快捷创建输入不能为空");
        }

        // Split on first comma -- title is before, tokens are after
        String title;
        String tokens;
        int commaIdx = input.indexOf(',');
        if (commaIdx >= 0) {
            title = input.substring(0, commaIdx).trim();
            tokens = input.substring(commaIdx + 1);
        } else {
            title = input.trim();
            tokens = "";
        }

        if (title.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "任务标题不能为空");
        }

        // Parse @mentions
        List<Long> mentionIds = parseMentions(tokens);

        // Parse ￥/$ hours (e.g. ￥8 or $8)
        BigDecimal hours = null;
        Matcher hoursMatcher = HOURS_PATTERN.matcher(tokens);
        if (hoursMatcher.find()) {
            hours = new BigDecimal(hoursMatcher.group(1));
        }

        // Parse ￥/$ days with 'd' suffix (e.g. ￥3d or $3d)
        Integer days = null;
        Matcher daysMatcher = DAYS_PATTERN.matcher(tokens);
        if (daysMatcher.find()) {
            days = Integer.parseInt(daysMatcher.group(1));
        }

        // Parse %type
        String type = TaskType.TASK.getCode(); // default
        Matcher typeMatcher = TYPE_PATTERN.matcher(tokens);
        if (typeMatcher.find()) {
            String parsedType = typeMatcher.group(1).toUpperCase();
            // Validate against known types
            for (TaskType tt : TaskType.values()) {
                if (tt.getCode().equals(parsedType)) {
                    type = parsedType;
                    break;
                }
            }
        }

        // Build CreateTaskDTO
        CreateTaskDTO createDto = new CreateTaskDTO();
        createDto.setTitle(title);
        createDto.setType(type);
        createDto.setProjectId(dto.getProjectId());
        createDto.setPlannedHours(hours);
        createDto.setPlannedDays(days);

        // Assign to first mentioned user
        if (!mentionIds.isEmpty()) {
            createDto.setAssigneeId(mentionIds.get(0));
        }

        return createTask(createDto);
    }

    // -----------------------------------------------------------------------
    //  Update
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public TaskVO updateTask(Long id, CreateTaskDTO dto) {
        Task task = getTaskOrThrow(id);

        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setType(dto.getType());
        if (dto.getProjectId() != null) {
            task.setProjectId(dto.getProjectId());
        }
        task.setAssigneeId(dto.getAssigneeId());
        task.setPlannedStart(dto.getPlannedStart());
        task.setPlannedEnd(dto.getPlannedEnd());
        task.setPlannedHours(dto.getPlannedHours());
        task.setPlannedDays(dto.getPlannedDays());
        task.setDueDate(dto.getDueDate());
        task.setTags(dto.getTags());

        taskMapper.updateById(task);

        recordActivity(id, SecurityUtils.getUserId(), "UPDATED", null, null, null);

        return toTaskVO(task);
    }

    @Override
    @Transactional
    public void updateProgress(Long id, Integer progress) {
        Task task = getTaskOrThrow(id);

        Integer oldProgress = task.getProgress();
        task.setProgress(progress);
        taskMapper.updateById(task);

        recordActivity(id, SecurityUtils.getUserId(), "UPDATED", "progress",
                oldProgress != null ? oldProgress.toString() : null,
                progress != null ? progress.toString() : null);

        notifyWatchers(id, "TASK_STATUS_CHANGED", "任务进度更新",
                "您关注的任务 [" + task.getTitle() + "] 进度更新为 " + progress + "%",
                SecurityUtils.getUserId());
    }

    // -----------------------------------------------------------------------
    //  Complete & Delete
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public void completeTask(Long id) {
        Task task = getTaskOrThrow(id);

        // Validate: only tasks not already completed or cancelled can be completed
        if (task.getStatus() == TaskStatus.COMPLETED.getCode()
                || task.getStatus() == TaskStatus.CANCELLED.getCode()) {
            throw new BusinessException(ErrorCode.TASK_CANNOT_COMPLETE);
        }

        // Check if approval is required
        boolean needsApproval = task.getMilestoneId() != null
                || TaskType.MILESTONE.getCode().equals(task.getType())
                || TaskType.ISSUE.getCode().equals(task.getType())
                || TaskType.RISK.getCode().equals(task.getType());

        if (needsApproval && workflowService != null) {
            // Idempotency guard: don't start a second approval if already pending review
            if (task.getStatus() == TaskStatus.PENDING_REVIEW.getCode()
                    && task.getFlowInstanceId() != null) {
                log.info("Task {} already pending review (flowInstance={}), skipping duplicate approval",
                        id, task.getFlowInstanceId());
                return;
            }

            Integer oldStatus = task.getStatus();
            task.setStatus(TaskStatus.PENDING_REVIEW.getCode()); // 3
            taskMapper.updateById(task);

            // Always route through TaskApprovalCallback so the task status is properly
            // updated on approval. TaskApprovalCallback also syncs the linked milestone.
            Long approvalObjectId = task.getId();
            String approvalObjectType = TaskType.TASK.getCode();

            Long boId = workflowService.startProcess(
                    "GENERIC_APPROVAL",
                    approvalObjectId,
                    approvalObjectType,
                    task.getTitle(),
                    task.getProjectId(),
                    SecurityUtils.getUserId(),
                    null
            );

            // Link flow instance back to task for idempotency guard and status tracking
            var bo = workflowService.getBusinessObjectEntity(boId);
            if (bo != null) {
                task.setFlowInstanceId(bo.getFlowInstanceId());
                taskMapper.updateById(task);
            }

            recordActivity(id, SecurityUtils.getUserId(), "APPROVAL_SUBMITTED", "status",
                    String.valueOf(oldStatus), String.valueOf(TaskStatus.PENDING_REVIEW.getCode()));

            notifyWatchers(id, "TASK_STATUS_CHANGED", "任务提交审批",
                    "您关注的任务 [" + task.getTitle() + "] 已提交审批",
                    SecurityUtils.getUserId());
            return;
        }

        // Direct completion (no approval required) — validate state machine
        Integer oldStatus = task.getStatus();
        if (!isValidTransition(oldStatus, TaskStatus.COMPLETED.getCode())) {
            throw new BusinessException(ErrorCode.TASK_INVALID_STATUS_TRANSITION,
                    String.format("Cannot transition from %s to COMPLETED", oldStatus));
        }
        task.setStatus(TaskStatus.COMPLETED.getCode());
        task.setProgress(100);
        task.setActualEnd(LocalDate.now());
        taskMapper.updateById(task);

        recalcProjectProgress(task.getProjectId());
        recalcPhaseProgress(task.getPhaseId());

        recordActivity(id, SecurityUtils.getUserId(), "STATUS_CHANGED", "status",
                String.valueOf(oldStatus), String.valueOf(TaskStatus.COMPLETED.getCode()));

        notifyWatchers(id, "TASK_STATUS_CHANGED", "任务已完成",
                "您关注的任务 [" + task.getTitle() + "] 已完成",
                SecurityUtils.getUserId());
    }

    @Override
    @Transactional
    public void deleteTask(Long id) {
        Task task = getTaskOrThrow(id);
        Long projectId = task.getProjectId();
        Long phaseId = task.getPhaseId();

        // Clean up dependencies referencing this task (both directions)
        taskDependencyMapper.delete(
                new LambdaQueryWrapper<com.syncflow.task.entity.TaskDependency>()
                        .eq(com.syncflow.task.entity.TaskDependency::getTaskId, id)
                        .or()
                        .eq(com.syncflow.task.entity.TaskDependency::getDependsOnTaskId, id));

        // Clean up watchers
        taskWatcherMapper.delete(
                new LambdaQueryWrapper<TaskWatcher>().eq(TaskWatcher::getTaskId, id));

        taskMapper.deleteById(id);

        recalcProjectProgress(projectId);
        recalcPhaseProgress(phaseId);

        recordActivity(id, SecurityUtils.getUserId(), "DELETED", null, null, null);
    }

    // -----------------------------------------------------------------------
    //  Status change (state machine)
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public void changeStatus(Long id, Integer newStatus) {
        Task task = getTaskOrThrow(id);
        Integer oldStatus = task.getStatus();

        // Validate transition
        if (!isValidTransition(oldStatus, newStatus)) {
            TaskStatus from = TaskStatus.fromCode(oldStatus);
            TaskStatus to = TaskStatus.fromCode(newStatus);
            throw new BusinessException(ErrorCode.TASK_INVALID_STATUS_TRANSITION,
                    "不允许从 " + (from != null ? from.getLabel() : oldStatus)
                            + " 变更为 " + (to != null ? to.getLabel() : newStatus));
        }

        task.setStatus(newStatus);

        // Auto-set progress on completion or cancellation
        if (newStatus == TaskStatus.COMPLETED.getCode()) {
            task.setProgress(100);
            task.setActualEnd(LocalDate.now());
        }

        // If transitioning away from PENDING_REVIEW with an active workflow, withdraw it
        if (oldStatus == TaskStatus.PENDING_REVIEW.getCode()
                && task.getFlowInstanceId() != null && workflowService != null) {
            try {
                workflowService.withdrawByFlowInstanceId(task.getFlowInstanceId());
            } catch (Exception e) {
                log.warn("Failed to withdraw orphaned workflow for task {}: {}", id, e.getMessage());
            }
            task.setFlowInstanceId(null);
            task.setTaskIdInFlow(null);
        }

        taskMapper.updateById(task);

        // Recalculate project progress whenever a task reaches a terminal state
        if (newStatus == TaskStatus.COMPLETED.getCode()
                || newStatus == TaskStatus.CANCELLED.getCode()) {
            recalcProjectProgress(task.getProjectId());
            recalcPhaseProgress(task.getPhaseId());
        }

        recordActivity(id, SecurityUtils.getUserId(), "STATUS_CHANGED", "status",
                String.valueOf(oldStatus), String.valueOf(newStatus));

        // Notify watchers
        TaskStatus newTaskStatus = TaskStatus.fromCode(newStatus);
        String statusLabel = newTaskStatus != null ? newTaskStatus.getLabel() : String.valueOf(newStatus);
        notifyWatchers(id, "TASK_STATUS_CHANGED", "任务状态变更",
                "您关注的任务 [" + task.getTitle() + "] 状态已变更为 " + statusLabel,
                SecurityUtils.getUserId());
    }

    // -----------------------------------------------------------------------
    //  Comments
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public CommentVO addComment(Long taskId, CreateCommentDTO dto) {
        Task task = getTaskOrThrow(taskId);
        Long currentUserId = SecurityUtils.getUserId();

        TaskComment comment = new TaskComment();
        comment.setTaskId(taskId);
        comment.setUserId(currentUserId);
        comment.setContent(dto.getContent());

        if (dto.getMentionedUsers() != null && !dto.getMentionedUsers().isEmpty()) {
            String mentioned = dto.getMentionedUsers().stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));
            comment.setMentionedUsers(mentioned);
        }

        taskCommentMapper.insert(comment);

        // Increment comment count on the task
        task.setCommentCount(task.getCommentCount() != null ? task.getCommentCount() + 1 : 1);
        taskMapper.updateById(task);

        // Record activity
        recordActivity(taskId, currentUserId, "COMMENTED", null, null, null);

        // Build VO
        CommentVO vo = new CommentVO();
        vo.setId(comment.getId());
        vo.setTaskId(taskId);
        vo.setContent(comment.getContent());
        vo.setUserId(currentUserId);
        vo.setCreatedAt(comment.getCreatedAt());

        // Enrich user name
        User user = userMapper.selectById(currentUserId);
        if (user != null) {
            vo.setUserName(user.getRealName());
        }

        notifyWatchers(taskId, "COMMENT_ADDED", "新评论",
                user != null ? user.getRealName() : "用户" + currentUserId
                        + " 在任务 [" + task.getTitle() + "] 中发表了评论",
                currentUserId);

        return vo;
    }

    // -----------------------------------------------------------------------
    //  Watch / Unwatch
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public void watchTask(Long taskId, Long userId) {
        getTaskOrThrow(taskId);

        // Check if already watching
        LambdaQueryWrapper<TaskWatcher> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TaskWatcher::getTaskId, taskId)
               .eq(TaskWatcher::getUserId, userId);
        if (taskWatcherMapper.selectCount(wrapper) > 0) {
            return; // already watching
        }

        TaskWatcher watcher = new TaskWatcher();
        watcher.setTaskId(taskId);
        watcher.setUserId(userId);
        taskWatcherMapper.insert(watcher);

        // Increment watcher count
        Task task = taskMapper.selectById(taskId);
        task.setWatcherCount(task.getWatcherCount() != null ? task.getWatcherCount() + 1 : 1);
        taskMapper.updateById(task);
    }

    @Override
    @Transactional
    public void unwatchTask(Long taskId, Long userId) {
        getTaskOrThrow(taskId);

        LambdaQueryWrapper<TaskWatcher> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TaskWatcher::getTaskId, taskId)
               .eq(TaskWatcher::getUserId, userId);
        int deleted = taskWatcherMapper.delete(wrapper);

        if (deleted > 0) {
            // Decrement watcher count
            Task task = taskMapper.selectById(taskId);
            if (task != null && task.getWatcherCount() != null && task.getWatcherCount() > 0) {
                task.setWatcherCount(task.getWatcherCount() - 1);
                taskMapper.updateById(task);
            }
        }
    }

    // -----------------------------------------------------------------------
    //  Comments & Activities
    // -----------------------------------------------------------------------

    @Override
    public PageResult<CommentVO> getComments(Long taskId, int pageNum, int pageSize) {
        getTaskOrThrow(taskId);

        Page<TaskComment> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<TaskComment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TaskComment::getTaskId, taskId)
               .orderByDesc(TaskComment::getCreatedAt);

        Page<TaskComment> result = taskCommentMapper.selectPage(page, wrapper);

        List<CommentVO> voList = result.getRecords().stream().map(c -> {
            CommentVO vo = new CommentVO();
            vo.setId(c.getId());
            vo.setTaskId(taskId);
            vo.setContent(c.getContent());
            vo.setUserId(c.getUserId());
            vo.setCreatedAt(c.getCreatedAt());
            // Enrich user name
            User user = userMapper.selectById(c.getUserId());
            if (user != null) {
                vo.setUserName(user.getRealName());
            }
            return vo;
        }).collect(Collectors.toList());

        return new PageResult<>(voList, result.getTotal(), result.getSize(), result.getCurrent());
    }

    @Override
    public List<TaskActivityVO> getActivities(Long taskId) {
        getTaskOrThrow(taskId);

        LambdaQueryWrapper<TaskActivity> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TaskActivity::getTaskId, taskId)
               .orderByDesc(TaskActivity::getCreatedAt);

        List<TaskActivity> activities = taskActivityMapper.selectList(wrapper);

        return activities.stream().map(a -> {
            TaskActivityVO vo = new TaskActivityVO();
            vo.setId(a.getId());
            vo.setTaskId(a.getTaskId());
            vo.setUserId(a.getUserId());
            vo.setAction(a.getAction());
            vo.setFieldName(a.getFieldName());
            vo.setOldValue(a.getOldValue());
            vo.setNewValue(a.getNewValue());
            vo.setCreatedAt(a.getCreatedAt());
            // Enrich user name
            User user = userMapper.selectById(a.getUserId());
            if (user != null) {
                vo.setUserName(user.getRealName());
            }
            return vo;
        }).collect(Collectors.toList());
    }

    // -----------------------------------------------------------------------
    //  Detail
    // -----------------------------------------------------------------------

    @Override
    public TaskVO getTaskDetail(Long id) {
        Task task = getTaskOrThrow(id);
        return toTaskVO(task);
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    private Task getTaskOrThrow(Long id) {
        Task task = taskMapper.selectById(id);
        if (task == null) {
            throw new BusinessException(ErrorCode.TASK_NOT_FOUND);
        }
        return task;
    }

    /**
     * Count tasks matching a lambda wrapper.
     */
    private long countWith(LambdaQueryWrapper<Task> wrapper) {
        return taskMapper.selectCount(wrapper);
    }

    /**
     * Count tasks of a specific type on top of an existing wrapper.
     */
    private long countWithType(LambdaQueryWrapper<Task> wrapper, TaskType type) {
        wrapper.eq(Task::getType, type.getCode());
        return taskMapper.selectCount(wrapper);
    }

    /**
     * Generate task number: TSK-YYYYMMDD-NNN.
     */
    private String generateTaskNo() {
        LocalDate today = LocalDate.now();
        String datePart = today.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int seq = bizCodeSequenceMapper.nextSequence("TSK", today);
        return String.format("TSK-%s-%03d", datePart, seq);
    }

    /**
     * Parse @username mentions from a string and resolve to user IDs.
     */
    private List<Long> parseMentions(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }
        Matcher matcher = MENTION_PATTERN.matcher(text);
        return matcher.results()
                .map(m -> m.group(1))
                .map(this::resolveUserId)
                .filter(id -> id != null)
                .collect(Collectors.toList());
    }

    /**
     * Look up a user by realName and return their ID.
     */
    private Long resolveUserId(String displayName) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getRealName, displayName);
        User user = userMapper.selectOne(wrapper);
        return user != null ? user.getId() : null;
    }

    /**
     * Parse a string to Long safely.
     */
    private Long parseLong(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Convert Task entity to full TaskVO with enriched display fields.
     */
    private TaskVO toTaskVO(Task task) {
        TaskVO vo = new TaskVO();
        vo.setId(task.getId());
        vo.setTaskNo(task.getTaskNo());
        vo.setTitle(task.getTitle());
        vo.setDescription(task.getDescription());
        vo.setType(task.getType());
        vo.setProjectId(task.getProjectId());
        vo.setPhaseId(task.getPhaseId());
        vo.setMilestoneId(task.getMilestoneId());
        vo.setParentId(task.getParentId());
        vo.setParentPath(task.getParentPath());
        vo.setStatus(task.getStatus());
        vo.setPriority(task.getPriority());
        vo.setProgress(task.getProgress());
        vo.setAssigneeId(task.getAssigneeId());
        vo.setReporterId(task.getReporterId());
        vo.setPlannedStart(task.getPlannedStart());
        vo.setPlannedEnd(task.getPlannedEnd());
        vo.setPlannedHours(task.getPlannedHours());
        vo.setPlannedDays(task.getPlannedDays());
        vo.setActualStart(task.getActualStart());
        vo.setActualEnd(task.getActualEnd());
        vo.setActualHours(task.getActualHours());
        vo.setDueDate(task.getDueDate());
        vo.setIsOverdue(task.getIsOverdue());
        vo.setIsWarning(task.getIsWarning());
        vo.setTags(task.getTags());
        vo.setTaskCategory(task.getTaskCategory());
        vo.setFlowInstanceId(task.getFlowInstanceId());
        vo.setTaskIdInFlow(task.getTaskIdInFlow());
        vo.setCommentCount(task.getCommentCount());
        vo.setAttachmentCount(task.getAttachmentCount());
        vo.setWatcherCount(task.getWatcherCount());
        vo.setCreatedAt(task.getCreatedAt());
        vo.setUpdatedAt(task.getUpdatedAt());

        // Type name from enum
        for (TaskType tt : TaskType.values()) {
            if (tt.getCode().equals(task.getType())) {
                vo.setTypeName(tt.getLabel());
                break;
            }
        }

        // Enrich assignee name
        if (task.getAssigneeId() != null) {
            User assignee = userMapper.selectById(task.getAssigneeId());
            if (assignee != null) {
                vo.setAssigneeName(assignee.getRealName());
            }
        }

        // Enrich reporter name
        if (task.getReporterId() != null) {
            User reporter = userMapper.selectById(task.getReporterId());
            if (reporter != null) {
                vo.setReporterName(reporter.getRealName());
            }
        }

        // Enrich project name
        if (task.getProjectId() != null) {
            Project project = projectMapper.selectById(task.getProjectId());
            if (project != null) {
                vo.setProjectName(project.getName());
            }
        }

        // Is current user watching?
        Long currentUserId = SecurityUtils.tryGetUserId();
        if (currentUserId != null) {
            LambdaQueryWrapper<TaskWatcher> watchWrapper = new LambdaQueryWrapper<>();
            watchWrapper.eq(TaskWatcher::getTaskId, task.getId())
                        .eq(TaskWatcher::getUserId, currentUserId);
            vo.setIsWatching(taskWatcherMapper.selectCount(watchWrapper) > 0);
        } else {
            vo.setIsWatching(false);
        }

        return vo;
    }

    /**
     * Record a task activity entry in the audit trail.
     */
    private void recordActivity(Long taskId, Long userId, String action,
                                String fieldName, String oldValue, String newValue) {
        TaskActivity activity = new TaskActivity();
        activity.setTaskId(taskId);
        activity.setUserId(userId);
        activity.setAction(action);
        activity.setFieldName(fieldName);
        activity.setOldValue(oldValue);
        activity.setNewValue(newValue);
        taskActivityMapper.insert(activity);
    }

    /**
     * Validate a status transition against the state machine rules.
     * <ul>
     *   <li>PENDING(1) -> IN_PROGRESS(2), CANCELLED(5)</li>
     *   <li>IN_PROGRESS(2) -> PENDING_REVIEW(3), COMPLETED(4), ON_HOLD(6), CANCELLED(5)</li>
     *   <li>PENDING_REVIEW(3) -> IN_PROGRESS(2), COMPLETED(4)</li>
     *   <li>ON_HOLD(6) -> IN_PROGRESS(2), CANCELLED(5)</li>
     *   <li>COMPLETED(4), CANCELLED(5) are terminal states</li>
     * </ul>
     */
    private boolean isValidTransition(int from, int to) {
        return switch (from) {
            case 1 -> to == 2 || to == 5; // PENDING -> IN_PROGRESS, CANCELLED
            case 2 -> to == 3 || to == 4 || to == 6 || to == 5; // IN_PROGRESS -> PENDING_REVIEW, COMPLETED, ON_HOLD, CANCELLED
            case 3 -> to == 2 || to == 4 || to == 5; // PENDING_REVIEW -> IN_PROGRESS, COMPLETED, CANCELLED
            case 6 -> to == 2 || to == 5; // ON_HOLD -> IN_PROGRESS, CANCELLED
            case 7 -> to == 2 || to == 5; // OVERDUE -> IN_PROGRESS, CANCELLED
            default -> false; // COMPLETED(4), CANCELLED(5) are terminal
        };
    }

    /**
     * Count tasks with a specific status on top of an existing wrapper.
     */
    private long countWithStatus(LambdaQueryWrapper<Task> wrapper, TaskStatus status) {
        wrapper.eq(Task::getStatus, status.getCode());
        return taskMapper.selectCount(wrapper);
    }

    /**
     * Recalculate and persist project progress as the ratio of completed tasks
     * to total non-cancelled tasks. No-op if projectId is null or project not found.
     */
    private void recalcProjectProgress(Long projectId) {
        if (projectId == null) return;
        Project project = projectMapper.selectById(projectId);
        if (project == null) return;

        LambdaQueryWrapper<Task> totalWrapper = new LambdaQueryWrapper<Task>()
                .eq(Task::getProjectId, projectId)
                .ne(Task::getStatus, TaskStatus.CANCELLED.getCode());
        long total = taskMapper.selectCount(totalWrapper);
        if (total == 0) return;

        LambdaQueryWrapper<Task> doneWrapper = new LambdaQueryWrapper<Task>()
                .eq(Task::getProjectId, projectId)
                .in(Task::getStatus, TaskStatus.COMPLETED.getCode(), TaskStatus.PENDING_REVIEW.getCode());
        long done = taskMapper.selectCount(doneWrapper);

        int progress = (int) Math.round((done * 100.0) / total);
        project.setProgress(progress);
        projectMapper.updateById(project);
        log.debug("Recalculated project {} progress: {}/{} = {}%", projectId, done, total, progress);
    }

    private void recalcPhaseProgress(Long phaseId) {
        if (phaseId == null) return;
        ProjectPhase phase = phaseMapper.selectById(phaseId);
        if (phase == null) return;

        long total = taskMapper.selectCount(new LambdaQueryWrapper<Task>()
                .eq(Task::getPhaseId, phaseId)
                .ne(Task::getStatus, TaskStatus.CANCELLED.getCode()));
        if (total == 0) return;

        long done = taskMapper.selectCount(new LambdaQueryWrapper<Task>()
                .eq(Task::getPhaseId, phaseId)
                .in(Task::getStatus, TaskStatus.COMPLETED.getCode(), TaskStatus.PENDING_REVIEW.getCode()));

        int progress = (int) Math.round((done * 100.0) / total);
        phase.setProgress(progress);
        phaseMapper.updateById(phase);
        log.debug("Recalculated phase {} progress: {}/{} = {}%", phaseId, done, total, progress);
    }

    /**
     * Send notifications to all watchers of a task, excluding the specified user.
     */
    private void notifyWatchers(Long taskId, String type, String title,
                                String content, Long excludeUserId) {
        if (notificationService == null) {
            log.debug("NotificationService not available, skipping notification for task {}", taskId);
            return;
        }
        LambdaQueryWrapper<TaskWatcher> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(TaskWatcher::getTaskId, taskId);
        List<TaskWatcher> watchers = taskWatcherMapper.selectList(wrapper);

        for (TaskWatcher watcher : watchers) {
            if (!watcher.getUserId().equals(excludeUserId)) {
                notificationService.sendNotification(
                        watcher.getUserId(), type, title, content, "TASK", taskId);
            }
        }
    }
}
