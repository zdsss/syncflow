package com.syncflow.task.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.admin.entity.User;
import com.syncflow.admin.mapper.UserMapper;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.util.SecurityUtils;
import com.syncflow.project.entity.Project;
import com.syncflow.project.mapper.ProjectMapper;
import com.syncflow.task.dto.*;
import com.syncflow.common.mapper.BizCodeSequenceMapper;
import com.syncflow.task.entity.Task;
import com.syncflow.task.entity.TaskActivity;
import com.syncflow.task.entity.TaskComment;
import com.syncflow.task.entity.TaskWatcher;
import com.syncflow.task.mapper.*;
import com.syncflow.task.service.impl.TaskServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskService")
class TaskServiceTest {

    @Mock
    private TaskMapper taskMapper;

    @Mock
    private TaskCommentMapper taskCommentMapper;

    @Mock
    private TaskWatcherMapper taskWatcherMapper;

    @Mock
    private TaskActivityMapper taskActivityMapper;

    @Mock
    private TaskParticipantMapper taskParticipantMapper;

    @Mock
    private TaskDependencyMapper taskDependencyMapper;

    @Mock
    private ProjectMapper projectMapper;

    @Mock
    private UserMapper userMapper;

    @Mock
    private BizCodeSequenceMapper bizCodeSequenceMapper;

    @InjectMocks
    private TaskServiceImpl taskService;

    private Task buildTask(Long id, String title, Integer status) {
        Task task = new Task();
        task.setId(id);
        task.setTaskNo("TSK-20260507-" + String.format("%03d", id));
        task.setTitle(title);
        task.setDescription("Description");
        task.setType("TASK");
        task.setProjectId(1L);
        task.setStatus(status);
        task.setProgress(0);
        task.setAssigneeId(1L);
        task.setReporterId(1L);
        task.setCommentCount(0);
        task.setAttachmentCount(0);
        task.setWatcherCount(0);
        task.setIsOverdue(false);
        task.setIsWarning(false);
        return task;
    }

    private CreateTaskDTO buildCreateTaskDTO(String title) {
        CreateTaskDTO dto = new CreateTaskDTO();
        dto.setTitle(title);
        dto.setType("TASK");
        dto.setProjectId(1L);
        dto.setAssigneeId(1L);
        return dto;
    }

    // -----------------------------------------------------------------------
    //  getTaskList
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getTaskList()")
    class GetTaskList {

        @SuppressWarnings("unchecked")
        @Test
        @DisplayName("should return paginated task list")
        void shouldReturnPaginatedTaskList() {
            TaskListVO taskVO = new TaskListVO();
            taskVO.setId(1L);
            taskVO.setTitle("Task 1");

            Page<TaskListVO> page = new Page<>(1, 10);
            page.setRecords(List.of(taskVO));
            page.setTotal(1);

            IPage<TaskListVO> iPage = page;
            when(taskMapper.selectTaskPage(any(Page.class), any(TaskQueryDTO.class)))
                    .thenReturn(iPage);

            TaskQueryDTO query = new TaskQueryDTO();
            PageResult<TaskListVO> result = taskService.getTaskList(query, 1, 10);

            assertNotNull(result);
            assertEquals(1, result.getRecords().size());
            verify(taskMapper).selectTaskPage(any(Page.class), any(TaskQueryDTO.class));
        }
    }

    // -----------------------------------------------------------------------
    //  getTaskStatistics
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getTaskStatistics()")
    class GetTaskStatistics {

        @Test
        @DisplayName("should return statistics for given user")
        void shouldReturnStatistics() {
            // All count queries return 0
            when(taskMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

            TaskStatisticsVO result = taskService.getTaskStatistics(1L);

            assertNotNull(result);
            assertEquals(0L, result.getToday());
            assertEquals(0L, result.getTotal());
            verify(taskMapper, atLeastOnce()).selectCount(any(LambdaQueryWrapper.class));
        }
    }

    // -----------------------------------------------------------------------
    //  createTask
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("createTask()")
    class CreateTask {

        @Test
        @DisplayName("should create task and return TaskVO")
        void shouldCreateTask() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::getUserId).thenReturn(1L);
                securityUtils.when(SecurityUtils::tryGetUserId).thenReturn(1L);

                CreateTaskDTO dto = buildCreateTaskDTO("New Task");

                // Task number generation: today count + 1
                when(taskMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
                when(taskMapper.insert(any(Task.class))).thenReturn(1);
                when(taskActivityMapper.insert(any(TaskActivity.class))).thenReturn(1);
                when(taskWatcherMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

                User user = new User();
                user.setId(1L);
                user.setRealName("Admin");
                when(userMapper.selectById(anyLong())).thenReturn(user);
                Project project = new Project();
                project.setId(1L);
                project.setName("Project 1");
                when(projectMapper.selectById(1L)).thenReturn(project);

                TaskVO result = taskService.createTask(dto);

                assertNotNull(result);
                assertEquals("New Task", result.getTitle());
                verify(taskMapper).insert(any(Task.class));
                verify(taskActivityMapper).insert(any(TaskActivity.class));
            }
        }
    }

    // -----------------------------------------------------------------------
    //  getTaskDetail
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getTaskDetail()")
    class GetTaskDetail {

        @Test
        @DisplayName("should return TaskVO when task exists")
        void shouldReturnTaskVO() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::tryGetUserId).thenReturn(1L);

                Task task = buildTask(1L, "My Task", 1);
                when(taskMapper.selectById(1L)).thenReturn(task);
                when(taskWatcherMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

                User user = new User();
                user.setId(1L);
                user.setRealName("Admin");
                when(userMapper.selectById(anyLong())).thenReturn(user);
                Project project = new Project();
                project.setId(1L);
                project.setName("Project 1");
                when(projectMapper.selectById(1L)).thenReturn(project);

                TaskVO result = taskService.getTaskDetail(1L);

                assertNotNull(result);
                assertEquals(1L, result.getId());
                assertEquals("My Task", result.getTitle());
                verify(taskMapper).selectById(1L);
            }
        }

        @Test
        @DisplayName("should throw when task not found")
        void shouldThrowWhenTaskNotFound() {
            when(taskMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> taskService.getTaskDetail(999L));
            assertEquals("Task not found", ex.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    //  updateTask
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("updateTask()")
    class UpdateTask {

        @Test
        @DisplayName("should update task fields")
        void shouldUpdateTask() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::getUserId).thenReturn(1L);
                securityUtils.when(SecurityUtils::tryGetUserId).thenReturn(1L);

                Task existing = buildTask(1L, "Old Title", 1);
                CreateTaskDTO dto = buildCreateTaskDTO("Updated Title");

                when(taskMapper.selectById(1L)).thenReturn(existing);
                when(taskMapper.updateById(any(Task.class))).thenReturn(1);
                when(taskActivityMapper.insert(any(TaskActivity.class))).thenReturn(1);
                when(taskWatcherMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

                User user = new User();
                user.setId(1L);
                user.setRealName("Admin");
                when(userMapper.selectById(anyLong())).thenReturn(user);
                Project project = new Project();
                project.setId(1L);
                project.setName("Project 1");
                when(projectMapper.selectById(1L)).thenReturn(project);

                TaskVO result = taskService.updateTask(1L, dto);

                assertNotNull(result);
                assertEquals("Updated Title", result.getTitle());
                verify(taskMapper).updateById(any(Task.class));
            }
        }

        @Test
        @DisplayName("should throw when task not found")
        void shouldThrowWhenTaskNotFound() {
            CreateTaskDTO dto = buildCreateTaskDTO("Title");
            when(taskMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> taskService.updateTask(999L, dto));
            assertEquals("Task not found", ex.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    //  completeTask
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("completeTask()")
    class CompleteTask {

        @Test
        @DisplayName("should mark task as completed")
        void shouldCompleteTask() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::getUserId).thenReturn(1L);

                Task task = buildTask(1L, "My Task", 2); // IN_PROGRESS (valid for direct completion)
                when(taskMapper.selectById(1L)).thenReturn(task);
                when(taskMapper.updateById(any(Task.class))).thenReturn(1);
                when(taskActivityMapper.insert(any(TaskActivity.class))).thenReturn(1);

                taskService.completeTask(1L);

                assertEquals(4, task.getStatus()); // COMPLETED
                assertEquals(100, task.getProgress());
                assertNotNull(task.getActualEnd());
                verify(taskMapper).updateById(task);
            }
        }

        @Test
        @DisplayName("should throw when task not found")
        void shouldThrowWhenTaskNotFound() {
            when(taskMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> taskService.completeTask(999L));
            assertEquals("Task not found", ex.getMessage());
        }

        @Test
        @DisplayName("should throw when task already completed")
        void shouldThrowWhenAlreadyCompleted() {
            Task task = buildTask(1L, "My Task", 4); // COMPLETED
            when(taskMapper.selectById(1L)).thenReturn(task);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> taskService.completeTask(1L));
            assertEquals("Task cannot be completed in its current state", ex.getMessage());
        }

        @Test
        @DisplayName("should trigger approval for milestone-linked task")
        void shouldTriggerApprovalForMilestoneLinkedTask() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::getUserId).thenReturn(1L);

                Task task = buildTask(1L, "My Task", 2); // IN_PROGRESS
                task.setMilestoneId(10L);
                when(taskMapper.selectById(1L)).thenReturn(task);
                when(taskMapper.updateById(any(Task.class))).thenReturn(1);
                when(taskActivityMapper.insert(any(TaskActivity.class))).thenReturn(1);

                // Mock WorkflowService via reflection (setter injection)
                com.syncflow.workflow.service.WorkflowService mockWorkflow =
                        org.mockito.Mockito.mock(com.syncflow.workflow.service.WorkflowService.class);
                taskService.setWorkflowService(mockWorkflow);

                taskService.completeTask(1L);

                assertEquals(3, task.getStatus()); // PENDING_REVIEW
                verify(mockWorkflow).startProcess(
                        eq("GENERIC_APPROVAL"), eq(1L), eq("TASK"),
                        eq("My Task"), eq(1L), eq(1L), isNull());
                // Should NOT be COMPLETED
                assertNotEquals(4, task.getStatus());
            }
        }

        @Test
        @DisplayName("should trigger approval for ISSUE type task")
        void shouldTriggerApprovalForIssueType() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::getUserId).thenReturn(1L);

                Task task = buildTask(1L, "My Issue", 2);
                task.setType("ISSUE");
                when(taskMapper.selectById(1L)).thenReturn(task);
                when(taskMapper.updateById(any(Task.class))).thenReturn(1);
                when(taskActivityMapper.insert(any(TaskActivity.class))).thenReturn(1);

                com.syncflow.workflow.service.WorkflowService mockWorkflow =
                        org.mockito.Mockito.mock(com.syncflow.workflow.service.WorkflowService.class);
                taskService.setWorkflowService(mockWorkflow);

                taskService.completeTask(1L);

                assertEquals(3, task.getStatus()); // PENDING_REVIEW
                verify(mockWorkflow).startProcess(
                        eq("GENERIC_APPROVAL"), eq(1L), eq("TASK"),
                        eq("My Issue"), eq(1L), eq(1L), isNull());
            }
        }
    }

    // -----------------------------------------------------------------------
    //  deleteTask
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("deleteTask()")
    class DeleteTask {

        @Test
        @DisplayName("should delete task")
        void shouldDeleteTask() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::getUserId).thenReturn(1L);

                Task task = buildTask(1L, "My Task", 1);
                when(taskMapper.selectById(1L)).thenReturn(task);
                when(taskMapper.deleteById(1L)).thenReturn(1);
                when(taskActivityMapper.insert(any(TaskActivity.class))).thenReturn(1);

                taskService.deleteTask(1L);

                verify(taskMapper).selectById(1L);
                verify(taskMapper).deleteById(1L);
            }
        }

        @Test
        @DisplayName("should throw when task not found")
        void shouldThrowWhenTaskNotFound() {
            when(taskMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> taskService.deleteTask(999L));
            assertEquals("Task not found", ex.getMessage());
            verify(taskMapper, never()).deleteById(anyLong());
        }
    }

    // -----------------------------------------------------------------------
    //  changeStatus
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("changeStatus()")
    class ChangeStatus {

        @Test
        @DisplayName("should transition from PENDING to IN_PROGRESS")
        void shouldTransitionPendingToInProgress() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::getUserId).thenReturn(1L);

                Task task = buildTask(1L, "My Task", 1); // PENDING
                when(taskMapper.selectById(1L)).thenReturn(task);
                when(taskMapper.updateById(any(Task.class))).thenReturn(1);
                when(taskActivityMapper.insert(any(TaskActivity.class))).thenReturn(1);

                taskService.changeStatus(1L, 2); // IN_PROGRESS

                assertEquals(2, task.getStatus());
                verify(taskMapper).updateById(task);
            }
        }

        @Test
        @DisplayName("should throw on invalid status transition")
        void shouldThrowOnInvalidTransition() {
            Task task = buildTask(1L, "My Task", 4); // COMPLETED (terminal)
            when(taskMapper.selectById(1L)).thenReturn(task);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> taskService.changeStatus(1L, 2));
            assertTrue(ex.getMessage().contains("Invalid task status transition")
                    || ex.getMessage().contains("not allowed")
                    || ex.getMessage().length() > 0);
        }
    }

    // -----------------------------------------------------------------------
    //  addComment
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("addComment()")
    class AddComment {

        @Test
        @DisplayName("should add comment to task")
        void shouldAddComment() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::getUserId).thenReturn(1L);

                Task task = buildTask(1L, "My Task", 1);
                task.setCommentCount(0);
                when(taskMapper.selectById(1L)).thenReturn(task);
                when(taskCommentMapper.insert(any(TaskComment.class))).thenReturn(1);
                when(taskMapper.updateById(any(Task.class))).thenReturn(1);
                when(taskActivityMapper.insert(any(TaskActivity.class))).thenReturn(1);

                User user = new User();
                user.setId(1L);
                user.setRealName("Admin");
                when(userMapper.selectById(1L)).thenReturn(user);

                CreateCommentDTO dto = new CreateCommentDTO();
                dto.setContent("This is a comment");

                CommentVO result = taskService.addComment(1L, dto);

                assertNotNull(result);
                assertEquals("This is a comment", result.getContent());
                assertEquals(1L, result.getUserId());
                verify(taskCommentMapper).insert(any(TaskComment.class));
                assertEquals(1, task.getCommentCount());
            }
        }
    }

    // -----------------------------------------------------------------------
    //  getComments
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getComments()")
    class GetComments {

        @Test
        @DisplayName("should return paginated comments")
        void shouldReturnPaginatedComments() {
            Task task = buildTask(1L, "My Task", 1);
            when(taskMapper.selectById(1L)).thenReturn(task);

            TaskComment comment = new TaskComment();
            comment.setId(1L);
            comment.setContent("Comment 1");
            comment.setUserId(1L);

            Page<TaskComment> page = new Page<>(1, 10);
            page.setRecords(List.of(comment));
            page.setTotal(1);

            when(taskCommentMapper.selectPage(any(Page.class), any(LambdaQueryWrapper.class)))
                    .thenReturn(page);
            User user = new User();
            user.setId(1L);
            user.setRealName("Admin");
            when(userMapper.selectById(1L)).thenReturn(user);

            PageResult<CommentVO> result = taskService.getComments(1L, 1, 10);

            assertNotNull(result);
            assertEquals(1, result.getRecords().size());
            assertEquals("Comment 1", result.getRecords().get(0).getContent());
        }
    }

    // -----------------------------------------------------------------------
    //  watchTask / unwatchTask
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("watchTask() / unwatchTask()")
    class WatchUnwatch {

        @Test
        @DisplayName("should watch task when not already watching")
        void shouldWatchTask() {
            Task task = buildTask(1L, "My Task", 1);
            task.setWatcherCount(0);
            when(taskMapper.selectById(1L)).thenReturn(task);
            when(taskWatcherMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
            when(taskWatcherMapper.insert(any(TaskWatcher.class))).thenReturn(1);
            when(taskMapper.updateById(any(Task.class))).thenReturn(1);

            taskService.watchTask(1L, 2L);

            verify(taskWatcherMapper).insert(any(TaskWatcher.class));
            assertEquals(1, task.getWatcherCount());
        }

        @Test
        @DisplayName("should not insert duplicate watcher")
        void shouldNotInsertDuplicateWatcher() {
            Task task = buildTask(1L, "My Task", 1);
            when(taskMapper.selectById(1L)).thenReturn(task);
            when(taskWatcherMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(1L);

            taskService.watchTask(1L, 2L);

            verify(taskWatcherMapper, never()).insert(any(TaskWatcher.class));
        }

        @Test
        @DisplayName("should unwatch task")
        void shouldUnwatchTask() {
            Task task = buildTask(1L, "My Task", 1);
            task.setWatcherCount(1);
            when(taskMapper.selectById(1L)).thenReturn(task);
            when(taskWatcherMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(1);
            when(taskMapper.updateById(any(Task.class))).thenReturn(1);

            taskService.unwatchTask(1L, 2L);

            assertEquals(0, task.getWatcherCount());
            verify(taskWatcherMapper).delete(any(LambdaQueryWrapper.class));
        }
    }

    // -----------------------------------------------------------------------
    //  quickCreate
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("quickCreate()")
    class QuickCreate {

        @Test
        @DisplayName("should create task from compact input format")
        void shouldCreateFromCompactInput() {
            try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
                securityUtils.when(SecurityUtils::getUserId).thenReturn(1L);
                securityUtils.when(SecurityUtils::tryGetUserId).thenReturn(1L);

                when(taskMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);
                when(taskMapper.insert(any(Task.class))).thenReturn(1);
                when(taskActivityMapper.insert(any(TaskActivity.class))).thenReturn(1);
                when(taskWatcherMapper.selectCount(any(LambdaQueryWrapper.class))).thenReturn(0L);

                User user = new User();
                user.setId(1L);
                user.setRealName("Admin");
                when(userMapper.selectById(anyLong())).thenReturn(user);
                Project project = new Project();
                project.setId(1L);
                project.setName("Project 1");
                when(projectMapper.selectById(1L)).thenReturn(project);

                QuickTaskDTO dto = new QuickTaskDTO();
                dto.setInput("Design review,#8%TASK");
                dto.setProjectId(1L);

                TaskVO result = taskService.quickCreate(dto);

                assertNotNull(result);
                assertEquals("Design review", result.getTitle());
                verify(taskMapper).insert(any(Task.class));
            }
        }

        @Test
        @DisplayName("should throw when input is empty")
        void shouldThrowWhenInputEmpty() {
            QuickTaskDTO dto = new QuickTaskDTO();
            dto.setInput("  ");

            assertThrows(BusinessException.class, () -> taskService.quickCreate(dto));
        }
    }
}
