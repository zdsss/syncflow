package com.syncflow.common.result;

import com.syncflow.common.enums.ErrorCode;

import java.io.Serializable;

/**
 * Unified API response wrapper.
 * <p>
 * Every controller method returns {@code Result<T>} so that the client always
 * receives a consistent JSON envelope:
 * <pre>
 * {
 *   "code": 200,
 *   "message": "success",
 *   "data": { ... },
 *   "timestamp": 1715000000000
 * }
 * </pre>
 *
 * @param <T> the type of the payload carried in {@code data}
 */
public class Result<T> implements Serializable {

    private static final long serialVersionUID = 1L;

    /** Business status code. 200 means success. */
    private int code;

    /** Human-readable description. */
    private String message;

    /** Response payload. May be {@code null} for error responses. */
    private T data;

    /** Epoch-millis timestamp when the response was built. */
    private long timestamp;

    public Result() {
        this.timestamp = System.currentTimeMillis();
    }

    public Result(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
        this.timestamp = System.currentTimeMillis();
    }

    // -----------------------------------------------------------------------
    //  Static factory methods — success
    // -----------------------------------------------------------------------

    /**
     * Successful response with no payload.
     */
    public static <T> Result<T> success() {
        return new Result<>(ErrorCode.SUCCESS.getCode(), ErrorCode.SUCCESS.getMessage(), null);
    }

    /**
     * Successful response carrying {@code data}.
     */
    public static <T> Result<T> success(T data) {
        return new Result<>(ErrorCode.SUCCESS.getCode(), ErrorCode.SUCCESS.getMessage(), data);
    }

    /**
     * Successful response with a custom {@code message} and {@code data}.
     */
    public static <T> Result<T> success(String message, T data) {
        return new Result<>(ErrorCode.SUCCESS.getCode(), message, data);
    }

    // -----------------------------------------------------------------------
    //  Static factory methods — error
    // -----------------------------------------------------------------------

    /**
     * Error response derived from an {@link ErrorCode}.
     */
    public static <T> Result<T> error(ErrorCode errorCode) {
        return new Result<>(errorCode.getCode(), errorCode.getMessage(), null);
    }

    /**
     * Error response derived from an {@link ErrorCode} with an overriding message.
     */
    public static <T> Result<T> error(ErrorCode errorCode, String message) {
        return new Result<>(errorCode.getCode(), message, null);
    }

    /**
     * Error response with explicit code and message.
     */
    public static <T> Result<T> error(int code, String message) {
        return new Result<>(code, message, null);
    }

    // -----------------------------------------------------------------------
    //  Getters / Setters
    // -----------------------------------------------------------------------

    public int getCode() {
        return code;
    }

    public void setCode(int code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    /**
     * Convenience predicate: {@code true} when {@code code == 200}.
     */
    public boolean isSuccess() {
        return this.code == ErrorCode.SUCCESS.getCode();
    }
}
