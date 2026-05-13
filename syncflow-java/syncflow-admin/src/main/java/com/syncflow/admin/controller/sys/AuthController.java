package com.syncflow.admin.controller.sys;

import com.syncflow.admin.dto.LoginDTO;
import com.syncflow.admin.dto.LoginVO;
import com.syncflow.admin.dto.RegisterDTO;
import com.syncflow.admin.dto.UpdateProfileDTO;
import com.syncflow.admin.dto.UserVO;
import com.syncflow.admin.service.AuthService;
import com.syncflow.admin.service.UserService;
import com.syncflow.common.result.Result;
import com.syncflow.common.util.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    public AuthController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping("/login")
    public Result<LoginVO> login(@Valid @RequestBody LoginDTO dto) {
        LoginVO vo = authService.login(dto);
        return Result.success(vo);
    }

    @PostMapping("/refresh")
    public Result<LoginVO> refreshToken(@RequestParam String refreshToken) {
        LoginVO vo = authService.refreshToken(refreshToken);
        return Result.success(vo);
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        SecurityUtils.clearCurrentUserId();
        return Result.success();
    }

    @GetMapping("/me")
    public Result<UserVO> getCurrentUser() {
        Long userId = SecurityUtils.getCurrentUserId();
        UserVO vo = userService.getUserById(userId);
        return Result.success(vo);
    }

    @PostMapping("/register")
    public Result<LoginVO> register(@Valid @RequestBody RegisterDTO dto) {
        LoginVO vo = authService.register(dto);
        return Result.success(vo);
    }

    @PostMapping("/forgot-password")
    public Result<Void> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        authService.forgotPassword(email);
        return Result.success();
    }

    @PostMapping("/reset-password")
    public Result<Void> resetPassword(@RequestBody Map<String, String> body) {
        authService.resetPassword(body.get("token"), body.get("password"));
        return Result.success();
    }

    @PutMapping("/profile")
    public Result<Void> updateProfile(@RequestBody UpdateProfileDTO dto) {
        Long userId = SecurityUtils.getCurrentUserId();
        authService.updateProfile(userId, dto);
        return Result.success();
    }

    @PutMapping("/password")
    public Result<Void> changePassword(@RequestBody Map<String, String> body) {
        Long userId = SecurityUtils.getCurrentUserId();
        authService.changePassword(userId, body.get("oldPassword"), body.get("newPassword"));
        return Result.success();
    }
}
