package com.syncflow.bom.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BomItemTreeVO {

    private Long id;

    private Long bomId;

    private Long parentId;

    private Integer level;

    private String path;

    private Integer seqNo;

    private String levelNo;

    private String materialCode;

    private String drawingNo;

    private String name;

    private String specification;

    private String material;

    private String surfaceTreatment;

    private String unit;

    private BigDecimal unitPrice;

    private BigDecimal weight;

    @JsonProperty("weightDisplay")
    public String getWeightDisplay() {
        return weight != null ? weight.stripTrailingZeros().toPlainString() : "";
    }

    private BigDecimal totalWeight;

    private BigDecimal quantity;

    private String sourceType;

    private Boolean isVirtual;

    private String storageLocation;

    @JsonProperty("location")
    public String getLocation() {
        return storageLocation;
    }

    private String unitOfMeasure;

    private String incomingInspection;

    private Boolean isOptional;

    private String remark;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private List<BomItemTreeVO> children;
}
