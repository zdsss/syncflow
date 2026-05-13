package com.syncflow.admin.dto;

import lombok.Data;

import java.util.List;

/**
 * Login response VO
 */
@Data
public class LoginVO {

    private String token;

    private String refreshToken;

    private Long userId;

    private String username;

    private String realName;

    private String avatar;

    private List<String> roles;
}
