package com.syncflow.common.exception;

import com.syncflow.common.enums.ErrorCode;
import com.syncflow.common.result.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

/**
 * Centralised exception-to-JSON translator.
 * <p>
 * Every exception thrown inside a {@code @RestController} is caught here and
 * converted into a uniform {@link Result} envelope so that the client always
 * receives a predictable shape.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Domain business rule violation.
     */
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.OK)
    public Result<Void> handleBusinessException(BusinessException ex) {
        log.warn("Business exception: code={}, message={}",
                ex.getErrorCode().getCode(), ex.getMessage());
        return Result.error(ex.getErrorCode(), ex.getMessage());
    }

    /**
     * {@code @Valid} / {@code @Validated} on {@code @RequestBody} failed.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        log.warn("Validation failed: {}", message);
        return Result.error(ErrorCode.PARAM_ERROR, message);
    }

    /**
     * {@code @Valid} on query / form parameters failed.
     */
    @ExceptionHandler(BindException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleBindException(BindException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        log.warn("Bind exception: {}", message);
        return Result.error(ErrorCode.PARAM_ERROR, message);
    }

    /**
     * HTTP method not supported (e.g. POST to a GET-only endpoint).
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public Result<Void> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        log.warn("Method not supported: {}", ex.getMessage());
        return Result.error(ErrorCode.PARAM_ERROR, "HTTP method not supported: " + ex.getMethod());
    }

    /**
     * Catch-all for anything unhandled.
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception ex) {
        log.error("Unexpected exception: {}", ex.getMessage(), ex);
        return Result.error(ErrorCode.SYSTEM_ERROR.getCode(),
                ex.getMessage() != null ? ex.getMessage() : "Internal server error");
    }
}
