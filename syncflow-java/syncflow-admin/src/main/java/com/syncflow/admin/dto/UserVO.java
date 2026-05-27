package com.syncflow.admin.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class UserVO {

    private Long id;

    private String username;

    private String realName;

    @JsonProperty("name")
    public String getName() {
        return realName;
    }

    private String phone;

    private String email;

    private String avatar;

    private Integer status;

    private String deptName;

    @JsonProperty("department")
    public String getDepartment() {
        return deptName;
    }

    private List<String> roles;
}
