package com.syncflow.common.service.resource;

import com.syncflow.common.dto.search.SearchResultVO;

/**
 * Global search service interface.
 */
public interface SearchService {

    /**
     * Search across multiple entity types (tasks, projects, articles, templates, resources).
     *
     * @param keyword the search keyword
     * @return aggregated search results grouped by type
     */
    SearchResultVO search(String keyword);
}
