package com.syncflow.common.dto.search;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Global search result view object.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResultVO {

    /** Search results from tasks. */
    private List<SearchItemVO> tasks;

    /** Search results from projects. */
    private List<SearchItemVO> projects;

    /** Search results from knowledge articles. */
    private List<SearchItemVO> articles;

    /** Search results from templates. */
    private List<SearchItemVO> templates;

    /** Search results from resources. */
    private List<SearchItemVO> resources;

    /**
     * A single search result item.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchItemVO {

        private Long id;
        private String title;
        private String type;
        private String summary;
        private String url;
    }
}
