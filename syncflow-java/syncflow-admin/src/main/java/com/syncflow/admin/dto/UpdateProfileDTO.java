package com.syncflow.admin.dto;

import lombok.Data;

@Data
public class UpdateProfileDTO {
    private String realName;
    private String phone;
    private String email;
    private String avatar;
}
