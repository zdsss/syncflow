package com.syncflow.statistics.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * Project progress item for the dashboard project progress list.
 */
@Data
public class ProjectProgressVO {

    /** Project ID. */
    private Long id;

    /** Project name. */
    private String name;

    /** Completion percentage 0-100. */
    private Integer progress;

    /** Project status label: not_started, in_progress, completed, delayed. */
    private String status;

    /** Planned end date. */
    private LocalDate dueDate;
}
