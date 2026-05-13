package com.syncflow.config.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * Module spec view object.
 */
@Data
public class SpecVO {

    private Long id;

    private String specName;

    private String crossSection;

    private String material;

    private BigDecimal wallThickness;

    private String connectionType;

    private String specCode;

    private Integer status;
}
