package com.syncflow.task.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.task.entity.TaskTemplate;
import com.syncflow.task.entity.TaskTemplateItem;
import com.syncflow.task.mapper.TaskTemplateItemMapper;
import com.syncflow.task.mapper.TaskTemplateMapper;
import com.syncflow.task.service.impl.TaskTemplateServiceImpl;
import org.apache.ibatis.builder.MapperBuilderAssistant;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskTemplateService")
class TaskTemplateServiceTest {

    @BeforeAll
    static void initMybatisPlusCache() {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), TaskTemplate.class);
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), TaskTemplateItem.class);
    }

    @Mock
    private TaskTemplateMapper taskTemplateMapper;

    @Mock
    private TaskTemplateItemMapper taskTemplateItemMapper;

    @InjectMocks
    private TaskTemplateServiceImpl taskTemplateService;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private TaskTemplate buildTemplate(Long id, String name, String scope, Long creatorId) {
        TaskTemplate template = new TaskTemplate();
        template.setId(id);
        template.setTenantId(1L);
        template.setName(name);
        template.setDescription("Description for " + name);
        template.setScope(scope);
        template.setCreatorId(creatorId);
        template.setIsDefault(false);
        template.setSortOrder(0);
        return template;
    }

    private TaskTemplateItem buildItem(Long id, Long templateId, String title, int sortOrder) {
        TaskTemplateItem item = new TaskTemplateItem();
        item.setId(id);
        item.setTemplateId(templateId);
        item.setTitle(title);
        item.setType("TASK");
        item.setSortOrder(sortOrder);
        return item;
    }

    // -----------------------------------------------------------------------
    //  listTemplates
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("listTemplates()")
    class ListTemplates {

        @Test
        @DisplayName("should return both PERSONAL and GLOBAL when scope is null")
        void shouldReturnBothScopesWhenScopeIsNull() {
            TaskTemplate personal = buildTemplate(1L, "Personal Template", "PERSONAL", 1L);
            TaskTemplate global = buildTemplate(2L, "Global Template", "GLOBAL", 2L);

            when(taskTemplateMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(personal, global));

            List<TaskTemplate> result = taskTemplateService.listTemplates(1L, null);

            assertEquals(2, result.size());
            verify(taskTemplateMapper).selectList(any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("should filter by scope when scope is provided")
        void shouldFilterByScope() {
            TaskTemplate global = buildTemplate(2L, "Global Template", "GLOBAL", 2L);

            when(taskTemplateMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(global));

            List<TaskTemplate> result = taskTemplateService.listTemplates(1L, "GLOBAL");

            assertEquals(1, result.size());
            assertEquals("GLOBAL", result.get(0).getScope());
            verify(taskTemplateMapper).selectList(any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("should return empty list when no templates found")
        void shouldReturnEmptyList() {
            when(taskTemplateMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());

            List<TaskTemplate> result = taskTemplateService.listTemplates(1L, null);

            assertTrue(result.isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  getTemplateDetail
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getTemplateDetail()")
    class GetTemplateDetail {

        @Test
        @DisplayName("should return template when found")
        void shouldReturnTemplateWhenFound() {
            TaskTemplate template = buildTemplate(1L, "My Template", "PERSONAL", 1L);
            when(taskTemplateMapper.selectById(1L)).thenReturn(template);

            TaskTemplate result = taskTemplateService.getTemplateDetail(1L);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals("My Template", result.getName());
            verify(taskTemplateMapper).selectById(1L);
        }

        @Test
        @DisplayName("should throw TASK_TEMPLATE_NOT_FOUND when not found")
        void shouldThrowWhenNotFound() {
            when(taskTemplateMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> taskTemplateService.getTemplateDetail(999L));
            assertEquals(ErrorCode.TASK_TEMPLATE_NOT_FOUND, ex.getErrorCode());
        }
    }

    // -----------------------------------------------------------------------
    //  createTemplate
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("createTemplate()")
    class CreateTemplate {

        @Test
        @DisplayName("should create template with items")
        void shouldCreateTemplateWithItems() {
            TaskTemplate template = buildTemplate(null, "New Template", "PERSONAL", 1L);
            TaskTemplateItem item1 = buildItem(null, null, "Item 1", 0);
            TaskTemplateItem item2 = buildItem(null, null, "Item 2", 1);

            when(taskTemplateMapper.insert(any(TaskTemplate.class))).thenAnswer(invocation -> {
                TaskTemplate t = invocation.getArgument(0);
                t.setId(1L);
                return 1;
            });
            when(taskTemplateItemMapper.insert(any(TaskTemplateItem.class))).thenReturn(1);

            TaskTemplate result = taskTemplateService.createTemplate(template, List.of(item1, item2));

            assertNotNull(result);
            assertEquals(1L, result.getId());
            verify(taskTemplateMapper).insert(template);
            verify(taskTemplateItemMapper, times(2)).insert(any(TaskTemplateItem.class));
            assertEquals(1L, item1.getTemplateId());
            assertEquals(1L, item2.getTemplateId());
        }

        @Test
        @DisplayName("should create template with no items")
        void shouldCreateTemplateWithNoItems() {
            TaskTemplate template = buildTemplate(null, "Empty Template", "GLOBAL", 1L);

            when(taskTemplateMapper.insert(any(TaskTemplate.class))).thenAnswer(invocation -> {
                TaskTemplate t = invocation.getArgument(0);
                t.setId(2L);
                return 1;
            });

            TaskTemplate result = taskTemplateService.createTemplate(template, null);

            assertNotNull(result);
            assertEquals(2L, result.getId());
            verify(taskTemplateMapper).insert(template);
            verify(taskTemplateItemMapper, never()).insert(any(TaskTemplateItem.class));
        }
    }

    // -----------------------------------------------------------------------
    //  updateTemplate
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("updateTemplate()")
    class UpdateTemplate {

        @Test
        @DisplayName("should update template and replace items")
        void shouldUpdateTemplateAndReplaceItems() {
            TaskTemplate existing = buildTemplate(1L, "Old Name", "PERSONAL", 1L);
            when(taskTemplateMapper.selectById(1L)).thenReturn(existing);
            when(taskTemplateMapper.updateById(any(TaskTemplate.class))).thenReturn(1);
            when(taskTemplateItemMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(2);
            when(taskTemplateItemMapper.insert(any(TaskTemplateItem.class))).thenReturn(1);

            TaskTemplate updated = buildTemplate(null, "New Name", "PERSONAL", 1L);
            TaskTemplateItem newItem = buildItem(null, null, "New Item", 0);

            TaskTemplate result = taskTemplateService.updateTemplate(1L, updated, List.of(newItem));

            assertNotNull(result);
            assertEquals(1L, result.getId());
            verify(taskTemplateMapper).updateById(updated);
            verify(taskTemplateItemMapper).delete(any(LambdaQueryWrapper.class));
            verify(taskTemplateItemMapper).insert(any(TaskTemplateItem.class));
        }

        @Test
        @DisplayName("should throw when template not found")
        void shouldThrowWhenNotFound() {
            when(taskTemplateMapper.selectById(999L)).thenReturn(null);

            TaskTemplate updated = buildTemplate(null, "Name", "PERSONAL", 1L);
            assertThrows(BusinessException.class,
                    () -> taskTemplateService.updateTemplate(999L, updated, null));
        }
    }

    // -----------------------------------------------------------------------
    //  deleteTemplate
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("deleteTemplate()")
    class DeleteTemplate {

        @Test
        @DisplayName("should delete template and items when creator matches")
        void shouldDeleteWhenCreatorMatches() {
            TaskTemplate template = buildTemplate(1L, "My Template", "PERSONAL", 1L);
            when(taskTemplateMapper.selectById(1L)).thenReturn(template);
            when(taskTemplateItemMapper.delete(any(LambdaQueryWrapper.class))).thenReturn(2);
            when(taskTemplateMapper.deleteById(1L)).thenReturn(1);

            taskTemplateService.deleteTemplate(1L, 1L);

            verify(taskTemplateItemMapper).delete(any(LambdaQueryWrapper.class));
            verify(taskTemplateMapper).deleteById(1L);
        }

        @Test
        @DisplayName("should throw when template not found")
        void shouldThrowWhenNotFound() {
            when(taskTemplateMapper.selectById(999L)).thenReturn(null);

            assertThrows(BusinessException.class,
                    () -> taskTemplateService.deleteTemplate(999L, 1L));
        }

        @Test
        @DisplayName("should throw when user is not the creator")
        void shouldThrowWhenNotCreator() {
            TaskTemplate template = buildTemplate(1L, "My Template", "PERSONAL", 1L);
            when(taskTemplateMapper.selectById(1L)).thenReturn(template);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> taskTemplateService.deleteTemplate(1L, 2L));
            assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }
    }
}
