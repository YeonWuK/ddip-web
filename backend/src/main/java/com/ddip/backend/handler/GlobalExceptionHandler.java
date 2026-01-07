package com.ddip.backend.handler;

import com.ddip.backend.dto.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> buildUncaughtException(Exception e) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;

        return ResponseEntity.status(status).body(new ErrorResponse("Unknown error occurred", e.getMessage()));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Object> buildErrorResponseException(BusinessException e) {

        ErrorCode errorCode = e.getErrorCode();

        return ResponseEntity.status(errorCode.httpStatus).body(new ErrorResponse(errorCode.code, errorCode.message));
    }
}