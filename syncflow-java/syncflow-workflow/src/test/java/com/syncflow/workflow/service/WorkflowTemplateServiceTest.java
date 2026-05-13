package com.syncflow.workflow.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.workflow.entity.WorkflowTemplate;
import com.syncflow.workflow.mapper.WorkflowTemplateMapper;
import com.syncflow.workflow.service.impl.WorkflowTemplateServiceImpl;
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
@DisplayName("WorkflowTemplateService")
class WorkflowTemplateServiceTest {

    @BeforeAll
    static void initMybatisPlusCache() {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), WorkflowTemplate.class);
    }

    @Mock
    private WorkflowTemplateMapper workflowTemplateMapper;

    @InjectMocks
    private WorkflowTemplateServiceImpl workflowTemplateService;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private WorkflowTemplate buildTemplate(Long id, String name, Long tenantId, Boolean isActive) {
        WorkflowTemplate template = new WorkflowTemplate();
        template.setId(id);
        template.setTenantId(tenantId);
        template.setName(name);
        template.setDescription("Description for " + name);
        template.setBpmnProcessKey("process_" + name.toLowerCase().replace(" ", "_"));
        template.setDefaultAssigneeRule("ROLE_BASED");
        template.setConfigJson("{\"approvalLevels\": 2}");
        template.setIsActive(isActive);
        return template;
    }

    // -----------------------------------------------------------------------
    //  listTemplates
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("listTemplates()")
    class ListTemplates {

        @Test
        @DisplayName("should return active templates filtered by tenantId")
        void shouldReturnActiveTemplatesFilteredByTenantId() {
            WorkflowTemplate t1 = buildTemplate(1L, "Template A", 1L, true);
            WorkflowTemplate t2 = buildTemplate(2L, "Template B", 1L, true);

            when(workflowTemplateMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(t1, t2));

            List<WorkflowTemplate> result = workflowTemplateService.listTemplates(1L);

            assertEquals(2, result.size());
            verify(workflowTemplateMapper).selectList(any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("should return all active templates when tenantId is null")
        void shouldReturnAllActiveWhenTenantIdIsNull() {
            when(workflowTemplateMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(buildTemplate(1L, "T1", 1L, true)));

            List<WorkflowTemplate> result = workflowTemplateService.listTemplates(null);

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("should return empty list when no templates found")
        void shouldReturnEmptyList() {
            when(workflowTemplateMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());

            List<WorkflowTemplate> result = workflowTemplateService.listTemplates(1L);

            assertTrue(result.isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  getTemplate
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("getTemplate()")
    class GetTemplate {

        @Test
        @DisplayName("should return template when found")
        void shouldReturnTemplateWhenFound() {
            WorkflowTemplate template = buildTemplate(1L, "My Workflow", 1L, true);
            when(workflowTemplateMapper.selectById(1L)).thenReturn(template);

            WorkflowTemplate result = workflowTemplateService.getTemplate(1L);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals("My Workflow", result.getName());
            verify(workflowTemplateMapper).selectById(1L);
        }

        @Test
        @DisplayName("should throw WORKFLOW_TEMPLATE_NOT_FOUND when not found")
        void shouldThrowWhenNotFound() {
            when(workflowTemplateMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> workflowTemplateService.getTemplate(999L));
            assertEquals(ErrorCode.WORKFLOW_TEMPLATE_NOT_FOUND, ex.getErrorCode());
        }
    }

    // -----------------------------------------------------------------------
    //  createTemplate
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("createTemplate()")
    class CreateTemplate {

        @Test
        @DisplayName("should create and return template")
        void shouldCreateTemplate() {
            WorkflowTemplate template = buildTemplate(null, "New Workflow", 1L, true);

            when(workflowTemplateMapper.insert(any(WorkflowTemplate.class))).thenAnswer(invocation -> {
                WorkflowTemplate t = invocation.getArgument(0);
                t.setId(1L);
                return 1;
            });

            WorkflowTemplate result = workflowTemplateService.createTemplate(template);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            verify(workflowTemplateMapper).insert(template);
        }
    }

    // -----------------------------------------------------------------------
    //  updateTemplate
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("updateTemplate()")
    class UpdateTemplate {

        @Test
        @DisplayName("should update template when found")
        void shouldUpdateTemplate() {
            WorkflowTemplate existing = buildTemplate(1L, "Old Name", 1L, true);
            when(workflowTemplateMapper.selectById(1L)).thenReturn(existing);
            when(workflowTemplateMapper.updateById(any(WorkflowTemplate.class))).thenReturn(1);

            WorkflowTemplate updated = buildTemplate(null, "New Name", 1L, true);
            WorkflowTemplate result = workflowTemplateService.updateTemplate(1L, updated);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            verify(workflowTemplateMapper).updateById(updated);
        }

        @Test
        @DisplayName("should throw when template not found")
        void shouldThrowWhenNotFound() {
            when(workflowTemplateMapper.selectById(999L)).thenReturn(null);

            WorkflowTemplate updated = buildTemplate(null, "Name", 1L, true);
            assertThrows(BusinessException.class,
                    () -> workflowTemplateService.updateTemplate(999L, updated));
        }
    }

    // -----------------------------------------------------------------------
    //  deleteTemplate
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("deleteTemplate()")
    class DeleteTemplate {

        @Test
        @DisplayName("should delete template when found")
        void shouldDeleteTemplate() {
            WorkflowTemplate existing = buildTemplate(1L, "My Workflow", 1L, true);
            when(workflowTemplateMapper.selectById(1L)).thenReturn(existing);
            when(workflowTemplateMapper.deleteById(1L)).thenReturn(1);

            workflowTemplateService.deleteTemplate(1L);

            verify(workflowTemplateMapper).deleteById(1L);
        }

        @Test
        @DisplayName("should throw when template not found")
        void shouldThrowWhenNotFound() {
            when(workflowTemplateMapper.selectById(999L)).thenReturn(null);

            assertThrows(BusinessException.class,
                    () -> workflowTemplateService.deleteTemplate(999L));
            verify(workflowTemplateMapper, never()).deleteById(anyLong());
        }
    }
}
