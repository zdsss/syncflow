package com.syncflow.common.exception;

import com.syncflow.common.enums.ErrorCode;

/**
 * Business-level exception thrown when a domain rule is violated.
 * <p>
 * Carries an {@link ErrorCode} so that the {@link GlobalExceptionHandler} can
 * translate it into a uniform {@code Result} JSON payload.
 *
 * <pre>
 * throw new BusinessException(ErrorCode.BOM_NOT_FOUND);
 * throw new BusinessException(ErrorCode.PARAM_ERROR, "BOM name must not be blank");
 * </pre>
 */
public class BusinessException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final ErrorCode errorCode;

    /**
     * Create with the message from the {@code ErrorCode} enum.
     */
    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    /**
     * Create with a custom message (overrides the enum default).
     */
    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    /**
     * Create with a custom message and a root cause.
     */
    public BusinessException(ErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
