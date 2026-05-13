package com.syncflow.common.service.resource.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.common.dto.resource.CreateResourceDTO;
import com.syncflow.common.dto.resource.ResourceVO;
import com.syncflow.common.entity.resource.Resource;
import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.mapper.resource.ResourceMapper;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.service.resource.ResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Resource service implementation.
 */
@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceMapper resourceMapper;

    @Override
    public PageResult<ResourceVO> getResourceList(String keyword, String type, int pageNum, int pageSize) {
        Page<Resource> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Resource> wrapper = new LambdaQueryWrapper<>();

        if (keyword != null && !keyword.isBlank()) {
            wrapper.like(Resource::getName, keyword)
                   .or()
                   .like(Resource::getDescription, keyword);
        }
        if (type != null && !type.isBlank()) {
            wrapper.eq(Resource::getType, type);
        }
        wrapper.orderByDesc(Resource::getCreatedAt);

        IPage<Resource> result = resourceMapper.selectPage(page, wrapper);
        List<ResourceVO> voList = result.getRecords().stream()
                .map(this::toResourceVO)
                .collect(Collectors.toList());
        return new PageResult<>(voList, result.getTotal(), result.getSize(), result.getCurrent());
    }

    @Override
    public ResourceVO getResourceDetail(Long id) {
        Resource resource = getResourceOrThrow(id);
        return toResourceVO(resource);
    }

    @Override
    @Transactional
    public ResourceVO createResource(CreateResourceDTO dto) {
        Resource resource = new Resource();
        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setDescription(dto.getDescription());
        resource.setStatus(dto.getStatus() != null ? dto.getStatus() : 1);
        resource.setContent(dto.getContent());

        resourceMapper.insert(resource);
        return toResourceVO(resource);
    }

    @Override
    @Transactional
    public ResourceVO updateResource(Long id, CreateResourceDTO dto) {
        Resource resource = getResourceOrThrow(id);

        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setDescription(dto.getDescription());
        if (dto.getStatus() != null) {
            resource.setStatus(dto.getStatus());
        }
        resource.setContent(dto.getContent());

        resourceMapper.updateById(resource);
        return toResourceVO(resource);
    }

    @Override
    @Transactional
    public void deleteResource(Long id) {
        getResourceOrThrow(id);
        resourceMapper.deleteById(id);
    }

    // -----------------------------------------------------------------------
    //  Private helpers
    // -----------------------------------------------------------------------

    private Resource getResourceOrThrow(Long id) {
        Resource resource = resourceMapper.selectById(id);
        if (resource == null) {
            throw new BusinessException(ErrorCode.RESOURCE_NOT_FOUND);
        }
        return resource;
    }

    private ResourceVO toResourceVO(Resource resource) {
        return ResourceVO.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .description(resource.getDescription())
                .status(resource.getStatus())
                .content(resource.getContent())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }
}
