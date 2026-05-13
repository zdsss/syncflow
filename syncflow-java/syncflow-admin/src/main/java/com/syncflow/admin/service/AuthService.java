package com.syncflow.admin.service;

import com.syncflow.admin.dto.LoginDTO;
import com.syncflow.admin.dto.LoginVO;
import com.syncflow.admin.dto.RegisterDTO;
import com.syncflow.admin.dto.UpdateProfileDTO;

public interface AuthService {

    LoginVO login(LoginDTO dto);

    LoginVO refreshToken(String refreshToken);

    LoginVO register(RegisterDTO dto);

    void forgotPassword(String email);

    void resetPassword(String token, String newPassword);

    void updateProfile(Long userId, UpdateProfileDTO dto);

    void changePassword(Long userId, String oldPassword, String newPassword);
}
