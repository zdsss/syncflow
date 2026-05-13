package com.syncflow.admin.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.syncflow.admin.dto.CreateUserDTO;
import com.syncflow.admin.dto.UserVO;

/**
 * User service interface
 */
public interface UserService {

    /**
     * Get paginated user list with optional keyword search
     */
    Page<UserVO> getUserList(String keyword, int pageNum, int pageSize);

    /**
     * Get user detail by ID
     */
    UserVO getUserById(Long id);

    /**
     * Create a new user
     */
    void createUser(CreateUserDTO dto);

    /**
     * Update an existing user
     */
    void updateUser(Long id, CreateUserDTO dto);

    /**
     * Soft-delete a user
     */
    void deleteUser(Long id);

    /**
     * Change user password (requires old password verification)
     */
    void changePassword(Long id, String oldPassword, String newPassword);

    /**
     * Enable or disable a user account
     */
    void updateUserStatus(Long id, Integer status);
}
