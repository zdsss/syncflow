package com.syncflow.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterDTO {

    @NotBlank(message = "Username cannot be blank")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 6, max = 100)
    private String password;

    private String name;

    @Email(message = "Invalid email format")
    private String email;
}
