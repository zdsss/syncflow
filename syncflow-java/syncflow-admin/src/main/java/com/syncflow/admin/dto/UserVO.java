package com.syncflow.admin.dto;

import lombok.Data;

import java.util.List;

/**
 * User view object
 */
@Data
public class UserVO {

    private Long id;

    private String username;

    private String realName;

    private String phone;

    private String email;

    private String avatar;

    private Integer status;

    private String deptName;

    private List<String> roles;
}
