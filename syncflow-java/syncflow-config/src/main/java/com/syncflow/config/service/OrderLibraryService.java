package com.syncflow.config.service;

import com.syncflow.config.dto.CategoryTreeVO;
import com.syncflow.config.dto.ProductVO;
import com.syncflow.config.entity.OrderCategory;
import com.syncflow.config.entity.OrderProduct;
import com.syncflow.config.entity.ProductBom;

import java.util.List;

/**
 * Order library service interface.
 * <p>
 * Manages order categories, products, and product-BOM associations.
 */
public interface OrderLibraryService {

    /**
     * Get the order category tree.
     *
     * @return list of top-level category tree nodes with children
     */
    List<CategoryTreeVO> getCategoryTree();

    /**
     * Create a new order category.
     *
     * @param category the category entity to persist
     * @return the persisted category
     */
    OrderCategory createCategory(OrderCategory category);

    /**
     * Get all products belonging to a category.
     *
     * @param categoryId FK to cfg_order_category.id (null for all)
     * @return list of product view objects
     */
    List<ProductVO> getProducts(Long categoryId);

    /**
     * Create a new order product.
     *
     * @param dto creation parameters
     * @return the created product view object
     */
    ProductVO createProduct(OrderProduct product);

    /**
     * Get the BOM associations for a product.
     *
     * @param productId FK to cfg_order_product.id
     * @return list of product-BOM associations
     */
    List<ProductBom> getProductBom(Long productId);
}
