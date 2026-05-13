package com.syncflow.workflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * DTO for starting a new approval process.
 */
@Data
public class StartProcessDTO {

    /** Flowable process-definition key. */
    @NotBlank(message = "processKey must not be blank")
    private String processKey;

    /** Primary key of the business entity. */
    @NotNull(message = "objectId must not be null")
    private Long objectId;

    /** Business object type, e.g. TASK, BOM. */
    @NotBlank(message = "objectType must not be blank")
    private String objectType;

    /** Human-readable business object name. */
    @NotBlank(message = "objectName must not be blank")
    private String objectName;

    /** Owning project id. */
    private Long projectId;

    /** User ids to CC on this approval. */
    private List<Long> ccUserIds;
}
