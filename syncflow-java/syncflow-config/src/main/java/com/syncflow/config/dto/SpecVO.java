package com.syncflow.config.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class SpecVO {

    private Long id;

    private String specName;

    @JsonProperty("name")
    public String getName() {
        return specName;
    }

    private String crossSection;

    @JsonProperty("sectionForm")
    public String getSectionForm() {
        return crossSection;
    }

    private String material;

    private String wallThickness;

    private String connectionType;

    @JsonProperty("connectionMethod")
    public String getConnectionMethod() {
        return connectionType;
    }

    private String specCode;

    @JsonProperty("moduleCode")
    public String getModuleCode() {
        return specCode;
    }

    private String status;
}
