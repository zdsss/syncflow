package com.syncflow.common.util;

import com.syncflow.common.exception.BusinessException;
import com.syncflow.common.enums.ErrorCode;

/**
 * Thread-local security context utilities.
 * <p>
 * The JWT authentication filter stores the current user's id and username
 * into a {@link ThreadLocal} before the request reaches the controller.
 * Service code retrieves those values via the static methods below.
 *
 * <pre>
 * Long userId = SecurityUtils.getUserId();
 * String username = SecurityUtils.getUsername();
 * </pre>
 *
 * <b>Important:</b> the {@code ThreadLocal} is cleaned up by the filter after
 * the request completes.  If you spawn child threads, you must propagate the
 * values manually.
 */
public final class SecurityUtils {

    private static final ThreadLocal<Long> USER_ID_HOLDER = new ThreadLocal<>();
    private static final ThreadLocal<String> USERNAME_HOLDER = new ThreadLocal<>();

    private SecurityUtils() {
        // utility class
    }

    // -----------------------------------------------------------------------
    //  Write (called by JWT filter)
    // -----------------------------------------------------------------------

    /**
     * Store the current user's id and username for this request thread.
     */
    public static void setCurrentUser(Long userId, String username) {
        USER_ID_HOLDER.set(userId);
        USERNAME_HOLDER.set(username);
    }

    /**
     * Store the current user's id (convenience for AuthService).
     */
    public static void setCurrentUserId(Long userId) {
        USER_ID_HOLDER.set(userId);
    }

    /**
     * Get the current user's id (alias for getUserId).
     */
    public static Long getCurrentUserId() {
        return getUserId();
    }

    /**
     * Clear the current user id (convenience for logout).
     */
    public static void clearCurrentUserId() {
        clear();
    }

    // -----------------------------------------------------------------------
    //  Read (called by service / controller code)
    // -----------------------------------------------------------------------

    /**
     * Get the current user's id.
     *
     * @return user id
     * @throws BusinessException if no user is set (i.e. called outside a
     *                           request that carries a valid JWT)
     */
    public static Long getUserId() {
        Long userId = USER_ID_HOLDER.get();
        if (userId == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "No authenticated user in current context");
        }
        return userId;
    }

    /**
     * Get the current user's username.
     *
     * @return username
     * @throws BusinessException if no user is set
     */
    public static String getUsername() {
        String username = USERNAME_HOLDER.get();
        if (username == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "No authenticated user in current context");
        }
        return username;
    }

    /**
     * Get both id and username as a simple record.
     *
     * @return current user info
     * @throws BusinessException if no user is set
     */
    public static UserInfo getCurrentUser() {
        return new UserInfo(getUserId(), getUsername());
    }

    /**
     * Try to get the user id without throwing.  Returns {@code null} if
     * called outside an authenticated request.
     */
    public static Long tryGetUserId() {
        return USER_ID_HOLDER.get();
    }

    // -----------------------------------------------------------------------
    //  Cleanup (called by JWT filter in a finally block)
    // -----------------------------------------------------------------------

    /**
     * Remove all thread-local values.  Must be called in a {@code finally}
     * block to prevent leaks in servlet-container thread pools.
     */
    public static void clear() {
        USER_ID_HOLDER.remove();
        USERNAME_HOLDER.remove();
    }

    // -----------------------------------------------------------------------
    //  Inner record
    // -----------------------------------------------------------------------

    /**
     * Immutable snapshot of the current authenticated user.
     */
    public record UserInfo(Long userId, String username) {
    }
}
