package com.syncflow.common.controller.knowledge;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.common.dto.knowledge.*;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.result.Result;
import com.syncflow.common.service.knowledge.KnowledgeService;
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
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(KnowledgeController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
@DisplayName("KnowledgeController")
class KnowledgeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private KnowledgeService knowledgeService;

    private ArticleVO buildArticleVO(Long id) {
        return ArticleVO.builder()
                .id(id)
                .title("Article " + id)
                .content("Content for article " + id)
                .category("GUIDE")
                .authorId(1L)
                .authorName("Admin")
                .tags("tag1,tag2")
                .viewCount(10)
                .commentCount(3)
                .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .build();
    }

    private ArticleCommentVO buildCommentVO(Long id) {
        return ArticleCommentVO.builder()
                .id(id)
                .articleId(1L)
                .authorId(1L)
                .authorName("Admin")
                .content("Comment " + id)
                .createdAt(LocalDateTime.of(2026, 1, 1, 12, 0))
                .build();
    }

    // -----------------------------------------------------------------------
    //  GET /api/knowledge/categories
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/knowledge/categories")
    class GetCategoriesTests {

        @Test
        @DisplayName("should return categories list")
        void getCategories_success() throws Exception {
            List<CategoryVO> categories = List.of(
                    CategoryVO.builder().category("GUIDE").articleCount(5).build(),
                    CategoryVO.builder().category("FAQ").articleCount(3).build()
            );
            when(knowledgeService.getCategories()).thenReturn(categories);

            mockMvc.perform(get("/api/knowledge/categories"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data.length()").value(2))
                    .andExpect(jsonPath("$.data[0].category").value("GUIDE"))
                    .andExpect(jsonPath("$.data[0].articleCount").value(5));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/knowledge/by-category/{category}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/knowledge/by-category/{category}")
    class GetArticlesByCategoryTests {

        @Test
        @DisplayName("should return articles by category")
        void getArticlesByCategory_success() throws Exception {
            List<ArticleVO> articles = List.of(buildArticleVO(1L), buildArticleVO(2L));
            when(knowledgeService.getArticlesByCategory("GUIDE")).thenReturn(articles);

            mockMvc.perform(get("/api/knowledge/by-category/GUIDE"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data.length()").value(2));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/knowledge
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/knowledge")
    class GetArticleListTests {

        @Test
        @DisplayName("should return paginated article list")
        void getArticleList_success() throws Exception {
            PageResult<ArticleVO> pageResult = new PageResult<>(
                    List.of(buildArticleVO(1L)), 1, 10, 1);
            when(knowledgeService.getArticleList(isNull(), isNull(), eq(1), eq(10)))
                    .thenReturn(pageResult);

            mockMvc.perform(get("/api/knowledge")
                            .param("pageNum", "1")
                            .param("pageSize", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.records").isArray())
                    .andExpect(jsonPath("$.data.total").value(1));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/knowledge/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/knowledge/{id}")
    class GetArticleDetailTests {

        @Test
        @DisplayName("should return article detail")
        void getArticleDetail_success() throws Exception {
            when(knowledgeService.getArticleDetail(1L)).thenReturn(buildArticleVO(1L));

            mockMvc.perform(get("/api/knowledge/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1))
                    .andExpect(jsonPath("$.data.title").value("Article 1"));
        }

        @Test
        @DisplayName("should return error when article not found")
        void getArticleDetail_notFound() throws Exception {
            when(knowledgeService.getArticleDetail(99L))
                    .thenThrow(new BusinessException(ErrorCode.ARTICLE_NOT_FOUND));

            mockMvc.perform(get("/api/knowledge/99"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(ErrorCode.ARTICLE_NOT_FOUND.getCode()));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/knowledge
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/knowledge")
    class CreateArticleTests {

        @Test
        @DisplayName("should create article successfully")
        void createArticle_success() throws Exception {
            CreateArticleDTO dto = CreateArticleDTO.builder()
                    .title("New Article")
                    .content("Content")
                    .category("GUIDE")
                    .build();
            when(knowledgeService.createArticle(any(CreateArticleDTO.class)))
                    .thenReturn(buildArticleVO(1L));

            mockMvc.perform(post("/api/knowledge")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(1));
        }
    }

    // -----------------------------------------------------------------------
    //  PATCH /api/knowledge/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("PATCH /api/knowledge/{id}")
    class UpdateArticleTests {

        @Test
        @DisplayName("should update article successfully")
        void updateArticle_success() throws Exception {
            CreateArticleDTO dto = CreateArticleDTO.builder()
                    .title("Updated Title")
                    .build();
            when(knowledgeService.updateArticle(eq(1L), any(CreateArticleDTO.class)))
                    .thenReturn(buildArticleVO(1L));

            mockMvc.perform(patch("/api/knowledge/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));
        }
    }

    // -----------------------------------------------------------------------
    //  DELETE /api/knowledge/{id}
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("DELETE /api/knowledge/{id}")
    class DeleteArticleTests {

        @Test
        @DisplayName("should delete article")
        void deleteArticle_success() throws Exception {
            doNothing().when(knowledgeService).deleteArticle(1L);

            mockMvc.perform(delete("/api/knowledge/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/knowledge/{articleId}/comments
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/knowledge/{articleId}/comments")
    class GetCommentsTests {

        @Test
        @DisplayName("should return comments for article")
        void getComments_success() throws Exception {
            PageResult<ArticleCommentVO> pageResult = new PageResult<>(
                    List.of(buildCommentVO(1L), buildCommentVO(2L)),
                    2, 10, 1);
            when(knowledgeService.getComments(1L, 1, 10)).thenReturn(pageResult);

            mockMvc.perform(get("/api/knowledge/1/comments")
                            .param("pageNum", "1")
                            .param("pageSize", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.records").isArray())
                    .andExpect(jsonPath("$.data.records.length()").value(2));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/knowledge/{articleId}/comments
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/knowledge/{articleId}/comments")
    class AddCommentTests {

        @Test
        @DisplayName("should add comment to article")
        void addComment_success() throws Exception {
            CreateArticleCommentDTO dto = CreateArticleCommentDTO.builder()
                    .content("Great article!")
                    .build();
            when(knowledgeService.addComment(eq(1L), any(CreateArticleCommentDTO.class)))
                    .thenReturn(buildCommentVO(1L));

            mockMvc.perform(post("/api/knowledge/1/comments")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(dto)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.content").value("Comment 1"));
        }
    }
}
