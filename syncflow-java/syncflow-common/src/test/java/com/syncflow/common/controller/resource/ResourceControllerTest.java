package com.syncflow.common.controller.resource;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.common.dto.resource.CreateResourceDTO;
import com.syncflow.common.dto.resource.ResourceVO;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.service.resource.ResourceService;
import com.syncflow.common.service.resource.SearchService;
import com.syncflow.common.dto.search.SearchResultVO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest({ResourceController.class, SearchController.class})
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("ResourceController")
class ResourceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ResourceService resourceService;

    @MockBean
    private SearchService searchService;

    private ResourceVO buildResourceVO(Long id) {
        return ResourceVO.builder()
                .id(id)
                .name("Resource " + id)
                .type("TOOL")
                .description("Description for resource " + id)
                .status(1)
                .content("{\"url\":\"https://example.com\"}")
                .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .build();
    }

    // -----------------------------------------------------------------------
    //  GET /api/resources
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/resources")
    class GetResourceListTests {

        @Test
        @DisplayName("should return paginated resource list")
        void getResourceList_success() throws Exception {
            PageResult<ResourceVO> pageResult = new PageResult<>(
                    List.of(buildResourceVO(1L), buildResourceVO(2L)),
                    2, 10, 1);
            when(resourceService.getResourceList(isNull(), isNull(), eq(1), eq(10)))
                    .thenReturn(pageResult);

            mockMvc.perform(get("/api/resources")
                            .param("pageNum", "1")
                            .param("pageSize", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.records").isArray())
                    .andExpect(jsonPath("$.data.total").value(2));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/resources/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/resources/{id}")
    class GetResourceDetailTests {

        @Test
        @DisplayName("should return resource detail")
        void getResourceDetail_success() throws Exception {
            when(resourceService.getResourceDetail(1L)).thenReturn(buildResourceVO(1L));

            mockMvc.perform(get("/api/resources/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.name").value("Resource 1"));
        }

        @Test
        @DisplayName("should return error when resource not found")
        void getResourceDetail_notFound() throws Exception {
            when(resourceService.getResourceDetail(99L))
                    .thenThrow(new BusinessException(ErrorCode.RESOURCE_NOT_FOUND));

            mockMvc.perform(get("/api/resources/99"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.RESOURCE_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/resources
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/resources")
    class CreateResourceTests {

        @Test
        @DisplayName("should create resource successfully")
        void createResource_success() throws Exception {
            CreateResourceDTO dto = CreateResourceDTO.builder()
                    .name("New Resource")
                    .type("TOOL")
                    .build();
            when(resourceService.createResource(any(CreateResourceDTO.class)))
                    .thenReturn(buildResourceVO(1L));

            mockMvc.perform(post("/api/resources")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1));
        }
    }

    // -----------------------------------------------------------------------
    //  PATCH /api/resources/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PATCH /api/resources/{id}")
    class UpdateResourceTests {

        @Test
        @DisplayName("should update resource successfully")
        void updateResource_success() throws Exception {
            CreateResourceDTO dto = CreateResourceDTO.builder()
                    .name("Updated Resource")
                    .build();
            when(resourceService.updateResource(eq(1L), any(CreateResourceDTO.class)))
                    .thenReturn(buildResourceVO(1L));

            mockMvc.perform(patch("/api/resources/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));
        }
    }

    // -----------------------------------------------------------------------
    //  DELETE /api/resources/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/resources/{id}")
    class DeleteResourceTests {

        @Test
        @DisplayName("should delete resource")
        void deleteResource_success() throws Exception {
            doNothing().when(resourceService).deleteResource(1L);

            mockMvc.perform(delete("/api/resources/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/search
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/search")
    class SearchTests {

        @Test
        @DisplayName("should return search results")
        void search_success() throws Exception {
            SearchResultVO result = SearchResultVO.builder()
                    .tasks(Collections.emptyList())
                    .projects(Collections.emptyList())
                    .articles(List.of(
                            SearchResultVO.SearchItemVO.builder()
                                    .id(1L)
                                    .title("Found Article")
                                    .type("ARTICLE")
                                    .build()
                    ))
                    .templates(Collections.emptyList())
                    .resources(Collections.emptyList())
                    .build();
            when(searchService.search("keyword")).thenReturn(result);

            mockMvc.perform(get("/api/search")
                            .param("q", "keyword"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.articles").isArray())
                    .andExpect(jsonPath("$.data.articles[0].title").value("Found Article"));
        }

        @Test
        @DisplayName("should return empty results for empty query")
        void search_emptyQuery() throws Exception {
            SearchResultVO result = SearchResultVO.builder()
                    .tasks(Collections.emptyList())
                    .projects(Collections.emptyList())
                    .articles(Collections.emptyList())
                    .templates(Collections.emptyList())
                    .resources(Collections.emptyList())
                    .build();
            when(searchService.search("")).thenReturn(result);

            mockMvc.perform(get("/api/search")
                            .param("q", ""))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.articles").isEmpty());
        }
    }
}
