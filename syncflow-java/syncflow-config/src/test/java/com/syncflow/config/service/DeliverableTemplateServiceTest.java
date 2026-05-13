package com.syncflow.config.service;

import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.TableInfoHelper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.config.entity.DeliverableTemplate;
import com.syncflow.config.mapper.DeliverableTemplateMapper;
import com.syncflow.config.service.impl.DeliverableTemplateServiceImpl;
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
@DisplayName("DeliverableTemplateService")
class DeliverableTemplateServiceTest {

    @BeforeAll
    static void initMybatisPlusCache() {
        TableInfoHelper.initTableInfo(new MapperBuilderAssistant(new MybatisConfiguration(), ""), DeliverableTemplate.class);
    }

    @Mock
    private DeliverableTemplateMapper deliverableTemplateMapper;

    @InjectMocks
    private DeliverableTemplateServiceImpl deliverableTemplateService;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private DeliverableTemplate buildTemplate(Long id, String name, Long tenantId) {
        DeliverableTemplate template = new DeliverableTemplate();
        template.setId(id);
        template.setTenantId(tenantId);
        template.setName(name);
        template.setDescription("Description for " + name);
        template.setItemsJson("[{\"name\":\"doc\",\"required\":true}]");
        template.setCreatedBy(1L);
        return template;
    }

    // -----------------------------------------------------------------------
    //  listTemplates
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("listTemplates()")
    class ListTemplates {

        @Test
        @DisplayName("should return list filtered by tenantId")
        void shouldReturnListFilteredByTenantId() {
            DeliverableTemplate t1 = buildTemplate(1L, "Template A", 1L);
            DeliverableTemplate t2 = buildTemplate(2L, "Template B", 1L);

            when(deliverableTemplateMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(t1, t2));

            List<DeliverableTemplate> result = deliverableTemplateService.listTemplates(1L);

            assertEquals(2, result.size());
            verify(deliverableTemplateMapper).selectList(any(LambdaQueryWrapper.class));
        }

        @Test
        @DisplayName("should return all templates when tenantId is null")
        void shouldReturnAllWhenTenantIdIsNull() {
            when(deliverableTemplateMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(List.of(buildTemplate(1L, "T1", 1L)));

            List<DeliverableTemplate> result = deliverableTemplateService.listTemplates(null);

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("should return empty list when no templates found")
        void shouldReturnEmptyList() {
            when(deliverableTemplateMapper.selectList(any(LambdaQueryWrapper.class)))
                    .thenReturn(Collections.emptyList());

            List<DeliverableTemplate> result = deliverableTemplateService.listTemplates(1L);

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
            DeliverableTemplate template = buildTemplate(1L, "My Template", 1L);
            when(deliverableTemplateMapper.selectById(1L)).thenReturn(template);

            DeliverableTemplate result = deliverableTemplateService.getTemplate(1L);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            assertEquals("My Template", result.getName());
            verify(deliverableTemplateMapper).selectById(1L);
        }

        @Test
        @DisplayName("should throw DELIVERABLE_TEMPLATE_NOT_FOUND when not found")
        void shouldThrowWhenNotFound() {
            when(deliverableTemplateMapper.selectById(999L)).thenReturn(null);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> deliverableTemplateService.getTemplate(999L));
            assertEquals(ErrorCode.DELIVERABLE_TEMPLATE_NOT_FOUND, ex.getErrorCode());
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
            DeliverableTemplate template = buildTemplate(null, "New Template", 1L);

            when(deliverableTemplateMapper.insert(any(DeliverableTemplate.class))).thenAnswer(invocation -> {
                DeliverableTemplate t = invocation.getArgument(0);
                t.setId(1L);
                return 1;
            });

            DeliverableTemplate result = deliverableTemplateService.createTemplate(template);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            verify(deliverableTemplateMapper).insert(template);
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
            DeliverableTemplate existing = buildTemplate(1L, "Old Name", 1L);
            when(deliverableTemplateMapper.selectById(1L)).thenReturn(existing);
            when(deliverableTemplateMapper.updateById(any(DeliverableTemplate.class))).thenReturn(1);

            DeliverableTemplate updated = buildTemplate(null, "New Name", 1L);
            DeliverableTemplate result = deliverableTemplateService.updateTemplate(1L, updated);

            assertNotNull(result);
            assertEquals(1L, result.getId());
            verify(deliverableTemplateMapper).updateById(updated);
        }

        @Test
        @DisplayName("should throw when template not found")
        void shouldThrowWhenNotFound() {
            when(deliverableTemplateMapper.selectById(999L)).thenReturn(null);

            DeliverableTemplate updated = buildTemplate(null, "Name", 1L);
            assertThrows(BusinessException.class,
                    () -> deliverableTemplateService.updateTemplate(999L, updated));
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
            DeliverableTemplate existing = buildTemplate(1L, "My Template", 1L);
            when(deliverableTemplateMapper.selectById(1L)).thenReturn(existing);
            when(deliverableTemplateMapper.deleteById(1L)).thenReturn(1);

            deliverableTemplateService.deleteTemplate(1L);

            verify(deliverableTemplateMapper).deleteById(1L);
        }

        @Test
        @DisplayName("should throw when template not found")
        void shouldThrowWhenNotFound() {
            when(deliverableTemplateMapper.selectById(999L)).thenReturn(null);

            assertThrows(BusinessException.class,
                    () -> deliverableTemplateService.deleteTemplate(999L));
            verify(deliverableTemplateMapper, never()).deleteById(anyLong());
        }
    }
}
