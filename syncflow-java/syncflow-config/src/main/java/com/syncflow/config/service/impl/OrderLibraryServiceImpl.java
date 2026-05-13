package com.syncflow.config.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.config.dto.CategoryTreeVO;
import com.syncflow.config.dto.ProductVO;
import com.syncflow.config.entity.OrderCategory;
import com.syncflow.config.entity.OrderProduct;
import com.syncflow.config.entity.ProductBom;
import com.syncflow.config.mapper.OrderCategoryMapper;
import com.syncflow.config.mapper.OrderProductMapper;
import com.syncflow.config.mapper.ProductBomMapper;
import com.syncflow.config.service.OrderLibraryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Order library service implementation.
 */
@Service
public class OrderLibraryServiceImpl implements OrderLibraryService {

    private final OrderCategoryMapper categoryMapper;
    private final OrderProductMapper productMapper;
    private final ProductBomMapper productBomMapper;

    public OrderLibraryServiceImpl(OrderCategoryMapper categoryMapper,
                                    OrderProductMapper productMapper,
                                    ProductBomMapper productBomMapper) {
        this.categoryMapper = categoryMapper;
        this.productMapper = productMapper;
        this.productBomMapper = productBomMapper;
    }

    // -----------------------------------------------------------------------
    //  Category tree
    // -----------------------------------------------------------------------

    @Override
    public List<CategoryTreeVO> getCategoryTree() {
        LambdaQueryWrapper<OrderCategory> wrapper = new LambdaQueryWrapper<>();
        wrapper.isNull(OrderCategory::getParentId)
               .orderByAsc(OrderCategory::getSortOrder);
        List<OrderCategory> roots = categoryMapper.selectList(wrapper);
        return roots.stream()
                .map(this::toCategoryTreeVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderCategory createCategory(OrderCategory category) {
        // Set path and level based on parent
        if (category.getParentId() != null) {
            OrderCategory parent = categoryMapper.selectById(category.getParentId());
            if (parent == null) {
                throw new BusinessException(ErrorCode.NOT_FOUND, "Parent category not found");
            }
            category.setPath(parent.getPath() + "/" + parent.getId());
            category.setLevel(parent.getLevel() != null ? parent.getLevel() + 1 : 1);
        } else {
            category.setPath("0");
            category.setLevel(0);
        }
        categoryMapper.insert(category);
        return category;
    }

    // -----------------------------------------------------------------------
    //  Products
    // -----------------------------------------------------------------------

    @Override
    public List<ProductVO> getProducts(Long categoryId) {
        LambdaQueryWrapper<OrderProduct> wrapper = new LambdaQueryWrapper<>();
        if (categoryId != null) {
            wrapper.eq(OrderProduct::getCategoryId, categoryId);
        }
        wrapper.orderByAsc(OrderProduct::getCreatedAt);
        List<OrderProduct> products = productMapper.selectList(wrapper);
        return products.stream()
                .map(this::toProductVO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProductVO createProduct(OrderProduct product) {
        productMapper.insert(product);
        return toProductVO(product);
    }

    // -----------------------------------------------------------------------
    //  Product BOM
    // -----------------------------------------------------------------------

    @Override
    public List<ProductBom> getProductBom(Long productId) {
        LambdaQueryWrapper<ProductBom> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProductBom::getProductId, productId);
        return productBomMapper.selectList(wrapper);
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    private CategoryTreeVO toCategoryTreeVO(OrderCategory category) {
        CategoryTreeVO vo = new CategoryTreeVO();
        vo.setId(category.getId());
        vo.setName(category.getName());
        vo.setCode(category.getCode());
        vo.setLevel(category.getLevel());

        // Recursively load children
        LambdaQueryWrapper<OrderCategory> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OrderCategory::getParentId, category.getId())
               .orderByAsc(OrderCategory::getSortOrder);
        List<OrderCategory> children = categoryMapper.selectList(wrapper);
        if (children != null && !children.isEmpty()) {
            vo.setChildren(children.stream()
                    .map(this::toCategoryTreeVO)
                    .collect(Collectors.toList()));
        } else {
            vo.setChildren(new ArrayList<>());
        }

        return vo;
    }

    private ProductVO toProductVO(OrderProduct product) {
        ProductVO vo = new ProductVO();
        vo.setId(product.getId());
        vo.setCode(product.getCode());
        vo.setName(product.getName());
        vo.setDescription(product.getDescription());
        vo.setStatus(product.getStatus());

        // Enrich category name
        if (product.getCategoryId() != null) {
            OrderCategory category = categoryMapper.selectById(product.getCategoryId());
            if (category != null) {
                vo.setCategoryName(category.getName());
            }
        }

        return vo;
    }
}
