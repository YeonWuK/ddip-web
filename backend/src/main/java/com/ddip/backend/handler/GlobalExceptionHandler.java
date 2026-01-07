package com.ddip.backend.handler;

import com.ddip.backend.dto.error.BusinessException;
import com.ddip.backend.dto.error.security.CustomAccessDeniedException;
import com.ddip.backend.dto.error.ErrorCode;
import com.ddip.backend.dto.error.ErrorResponse;
import com.ddip.backend.dto.error.security.CustomAuthenticationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> buildUncaughtException(Exception e) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;

        log.info("InternalServerError", e);

        return ResponseEntity.status(status).body(new ErrorResponse("Unknown error occurred", e.getMessage()));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Object> buildErrorResponseException(BusinessException e) {
        ErrorCode errorCode = e.getErrorCode();

        log.info("BusinessError", e);

        return build(errorCode, e.getDetail());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Object> handleAccessDeniedException(AccessDeniedException e) {

        log.info("AccessDeniedException", e);

        if (e instanceof CustomAccessDeniedException custom) {
            return build(custom.getErrorCode(), custom.getDetail());
        }

        return build(ErrorCode.FORBIDDEN, e.getMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Object> buildErrorResponseException(AuthenticationException e) {

        log.info("AuthenticationException", e);

        if (e instanceof CustomAuthenticationException custom) {
            return build(custom.getErrorCode(), custom.getDetail());
        }

        return build(ErrorCode.UNAUTHORIZED, e.getMessage());
    }

    private ResponseEntity<Object> build(ErrorCode errorCode, String detail) {
        ErrorResponse body = (detail == null)
                ? new ErrorResponse(errorCode.code, errorCode.message)
                : new ErrorResponse(errorCode.code, errorCode.message, detail);

        return ResponseEntity.status(errorCode.httpStatus).body(body);
    }
}