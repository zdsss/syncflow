package com.syncflow.config.controller.cfg;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.syncflow.common.exception.GlobalExceptionHandler;
import com.syncflow.config.dto.CategoryTreeVO;
import com.syncflow.config.dto.ProductVO;
import com.syncflow.config.entity.OrderCategory;
import com.syncflow.config.entity.OrderProduct;
import com.syncflow.config.entity.ProductBom;
import com.syncflow.config.service.OrderLibraryService;
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

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OrderLibraryController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class OrderLibraryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderLibraryService orderLibraryService;

    // -----------------------------------------------------------------------
    //  Helpers
    // -----------------------------------------------------------------------

    private CategoryTreeVO buildCategoryTreeVO() {
        CategoryTreeVO vo = new CategoryTreeVO();
        vo.setId(1L);
        vo.setName("Standard Orders");
        vo.setCode("STD");
        vo.setLevel(0);
        vo.setChildren(Collections.emptyList());
        return vo;
    }

    private ProductVO buildProductVO() {
        ProductVO vo = new ProductVO();
        vo.setId(1L);
        vo.setCode("PROD-01");
        vo.setName("Widget A");
        vo.setStatus(1);
        vo.setCategoryName("Standard Orders");
        return vo;
    }

    private ProductBom buildProductBom() {
        ProductBom bom = new ProductBom();
        bom.setId(1L);
        bom.setProductId(1L);
        bom.setBomId(10L);
        bom.setIsDefault(true);
        return bom;
    }

    // -----------------------------------------------------------------------
    //  GET /api/config/orders/categories
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/config/orders/categories")
    class GetCategoryTree {

        @Test
        @DisplayName("should return order category tree")
        void shouldReturnCategoryTree() throws Exception {
            when(orderLibraryService.getCategoryTree())
                    .thenReturn(Collections.singletonList(buildCategoryTreeVO()));

            mockMvc.perform(get("/api/config/orders/categories"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].name").value("Standard Orders"))
                    .andExpect(jsonPath("$.data[0].code").value("STD"));
        }

        @Test
        @DisplayName("should return empty list when no categories exist")
        void shouldReturnEmptyList() throws Exception {
            when(orderLibraryService.getCategoryTree())
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/config/orders/categories"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/config/orders/categories
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/config/orders/categories")
    class CreateCategory {

        @Test
        @DisplayName("should create a new order category")
        void shouldCreateCategory() throws Exception {
            OrderCategory input = new OrderCategory();
            input.setName("Custom Orders");
            input.setCode("CUST");

            OrderCategory saved = new OrderCategory();
            saved.setId(2L);
            saved.setName("Custom Orders");
            saved.setCode("CUST");

            when(orderLibraryService.createCategory(any(OrderCategory.class)))
                    .thenReturn(saved);

            mockMvc.perform(post("/api/config/orders/categories")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(input)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.id").value(2))
                    .andExpect(jsonPath("$.data.name").value("Custom Orders"))
                    .andExpect(jsonPath("$.data.code").value("CUST"));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/config/orders/products
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/config/orders/products")
    class GetProducts {

        @Test
        @DisplayName("should return products filtered by category")
        void shouldReturnProducts() throws Exception {
            when(orderLibraryService.getProducts(1L))
                    .thenReturn(Collections.singletonList(buildProductVO()));

            mockMvc.perform(get("/api/config/orders/products")
                            .param("categoryId", "1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].code").value("PROD-01"))
                    .andExpect(jsonPath("$.data[0].categoryName").value("Standard Orders"));
        }

        @Test
        @DisplayName("should return all products when no categoryId given")
        void shouldReturnAllProducts() throws Exception {
            when(orderLibraryService.getProducts(isNull()))
                    .thenReturn(Collections.singletonList(buildProductVO()));

            mockMvc.perform(get("/api/config/orders/products"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1));
        }
    }

    // -----------------------------------------------------------------------
    //  POST /api/config/orders/products
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("POST /api/config/orders/products")
    class CreateProduct {

        @Test
        @DisplayName("should create a new product")
        void shouldCreateProduct() throws Exception {
            OrderProduct input = new OrderProduct();
            input.setName("Widget B");
            input.setCode("PROD-02");
            input.setCategoryId(1L);

            ProductVO result = buildProductVO();
            result.setName("Widget B");
            result.setCode("PROD-02");
            when(orderLibraryService.createProduct(any(OrderProduct.class)))
                    .thenReturn(result);

            mockMvc.perform(post("/api/config/orders/products")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(input)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data.name").value("Widget B"))
                    .andExpect(jsonPath("$.data.code").value("PROD-02"));
        }
    }

    // -----------------------------------------------------------------------
    //  GET /api/config/orders/products/{productId}/bom
    // -----------------------------------------------------------------------

    @Nested
    @DisplayName("GET /api/config/orders/products/{productId}/bom")
    class GetProductBom {

        @Test
        @DisplayName("should return BOM associations for a product")
        void shouldReturnProductBom() throws Exception {
            when(orderLibraryService.getProductBom(1L))
                    .thenReturn(Collections.singletonList(buildProductBom()));

            mockMvc.perform(get("/api/config/orders/products/1/bom"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data[0].id").value(1))
                    .andExpect(jsonPath("$.data[0].productId").value(1))
                    .andExpect(jsonPath("$.data[0].bomId").value(10))
                    .andExpect(jsonPath("$.data[0].isDefault").value(true));
        }

        @Test
        @DisplayName("should return empty list when product has no BOMs")
        void shouldReturnEmptyList() throws Exception {
            when(orderLibraryService.getProductBom(999L))
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/config/orders/products/999/bom"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.code").value(200))
                    .andExpect(jsonPath("$.data").isEmpty());
        }
    }
}
