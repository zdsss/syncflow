package com.syncflow.bom.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * View object for BOM version history entries.
 */
@Data
public class BomVersionVO {

    private Long id;

    private Long bomId;

    private String version;

    private String changeSummary;

    private Long createdBy;

    /** Display name of the user who created this version. */
    private String createdByName;

    private LocalDateTime createdAt;
}
