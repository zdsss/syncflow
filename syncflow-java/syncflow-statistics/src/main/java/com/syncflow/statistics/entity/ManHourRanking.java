package com.syncflow.statistics.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Man-hour ranking entity.
 * <p>
 * Maps to the {@code sta_man_hour_ranking} table.
 */
@Data
@TableName("sta_man_hour_ranking")
public class ManHourRanking {

    @TableId(type = IdType.AUTO)
    private Long id;

    /** FK to sys_user.id. */
    private Long userId;

    /** Denormalized user display name. */
    private String userName;

    /** FK to prj_project.id. */
    private Long projectId;

    /** Total logged hours for the ranking period. */
    private BigDecimal hours;

    /** The date this ranking snapshot represents. */
    private LocalDate rankingDate;

    /** Numeric rank position. */
    private Integer ranking;

    /** Timestamp when this record was created. */
    private LocalDateTime createdAt;
}
