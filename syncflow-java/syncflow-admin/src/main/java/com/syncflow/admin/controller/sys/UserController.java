package com.syncflow.admin.controller.sys;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.admin.dto.ChangePasswordDTO;
import com.syncflow.admin.dto.CreateUserDTO;
import com.syncflow.admin.dto.UpdateUserStatusDTO;
import com.syncflow.admin.dto.UserVO;
import com.syncflow.admin.service.UserService;
import com.syncflow.common.result.PageResult;
import com.syncflow.common.result.Result;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * User management controller
 */
@RestController
@RequestMapping("/api/sys/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Get paginated user list with optional keyword search
     */
    @GetMapping
    public Result<PageResult<UserVO>> getUserList(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        Page<UserVO> page = userService.getUserList(keyword, pageNum, pageSize);
        PageResult<UserVO> pageResult = PageResult.of(page);
        return Result.success(pageResult);
    }

    /**
     * Get user detail by ID
     */
    @GetMapping("/{id}")
    public Result<UserVO> getUserById(@PathVariable Long id) {
        UserVO vo = userService.getUserById(id);
        return Result.success(vo);
    }

    /**
     * Create a new user
     */
    @PostMapping
    public Result<Void> createUser(@Valid @RequestBody CreateUserDTO dto) {
        userService.createUser(dto);
        return Result.success();
    }

    /**
     * Update an existing user
     */
    @PutMapping("/{id}")
    public Result<Void> updateUser(@PathVariable Long id,
                                   @Valid @RequestBody CreateUserDTO dto) {
        userService.updateUser(id, dto);
        return Result.success();
    }

    /**
     * Delete a user (soft delete)
     */
    @DeleteMapping("/{id}")
    public Result<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return Result.success();
    }

    /**
     * Change user password
     */
    @PutMapping("/{id}/password")
    public Result<Void> changePassword(@PathVariable Long id,
                                       @Valid @RequestBody ChangePasswordDTO dto) {
        userService.changePassword(id, dto.getOldPassword(), dto.getNewPassword());
        return Result.success();
    }

    /**
     * Enable or disable a user
     */
    @PutMapping("/{id}/status")
    public Result<Void> updateUserStatus(@PathVariable Long id,
                                         @Valid @RequestBody UpdateUserStatusDTO dto) {
        userService.updateUserStatus(id, dto.getStatus());
        return Result.success();
    }
}
