package com.syncflow.config.controller.cfg;

import com.syncflow.common.result.Result;
import com.syncflow.config.dto.CategoryTreeVO;
import com.syncflow.config.dto.ProductVO;
import com.syncflow.config.entity.OrderCategory;
import com.syncflow.config.entity.OrderProduct;
import com.syncflow.config.entity.ProductBom;
import com.syncflow.config.service.OrderLibraryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Order library controller.
 * <p>
 * Manages order categories, products, and product-BOM associations.
 */
@RestController
@RequestMapping("/api/config/orders")
public class OrderLibraryController {

    private final OrderLibraryService orderLibraryService;

    public OrderLibraryController(OrderLibraryService orderLibraryService) {
        this.orderLibraryService = orderLibraryService;
    }

    // -----------------------------------------------------------------------
    //  Category tree
    // -----------------------------------------------------------------------

    /**
     * Get the order category tree.
     */
    @GetMapping("/categories")
    public Result<List<CategoryTreeVO>> getCategoryTree() {
        List<CategoryTreeVO> tree = orderLibraryService.getCategoryTree();
        return Result.success(tree);
    }

    /**
     * Create a new order category.
     */
    @PostMapping("/categories")
    public Result<OrderCategory> createCategory(@Valid @RequestBody OrderCategory category) {
        OrderCategory created = orderLibraryService.createCategory(category);
        return Result.success(created);
    }

    // -----------------------------------------------------------------------
    //  Products
    // -----------------------------------------------------------------------

    /**
     * Get products by category.
     *
     * @param categoryId optional category filter
     */
    @GetMapping("/products")
    public Result<List<ProductVO>> getProducts(
            @RequestParam(required = false) Long categoryId) {
        List<ProductVO> products = orderLibraryService.getProducts(categoryId);
        return Result.success(products);
    }

    /**
     * Create a new order product.
     */
    @PostMapping("/products")
    public Result<ProductVO> createProduct(@Valid @RequestBody OrderProduct product) {
        ProductVO vo = orderLibraryService.createProduct(product);
        return Result.success(vo);
    }

    // -----------------------------------------------------------------------
    //  Product BOM
    // -----------------------------------------------------------------------

    /**
     * Get BOM associations for a product.
     */
    @GetMapping("/products/{productId}/bom")
    public Result<List<ProductBom>> getProductBom(@PathVariable Long productId) {
        List<ProductBom> boms = orderLibraryService.getProductBom(productId);
        return Result.success(boms);
    }
}
