package com.syncflow.common.controller.resource;

import com.syncflow.common.dto.search.SearchResultVO;
import com.syncflow.common.result.Result;
import com.syncflow.common.service.resource.SearchService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Global search controller.
 */
@RestController
@RequestMapping("/api/search")
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    /**
     * Global search across articles, templates, resources.
     */
    @GetMapping
    public Result<SearchResultVO> search(@RequestParam String q) {
        SearchResultVO result = searchService.search(q);
        return Result.success(result);
    }
}
