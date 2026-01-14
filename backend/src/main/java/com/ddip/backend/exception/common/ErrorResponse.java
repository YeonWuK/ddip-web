<<<<<<<< HEAD:backend/src/main/java/com/ddip/backend/exception/ErrorResponse.java
package com.ddip.backend.exception;
========
package com.ddip.backend.exception.common;
>>>>>>>> 6b7905e (feat: exception 예외처리 각 도메인 별로 생성):backend/src/main/java/com/ddip/backend/exception/common/ErrorResponse.java

import lombok.Getter;

@Getter
public class ErrorResponse {

    private final int statusCode;
    private final String error;
    private final String code;
    private final String message;
    private final String detail;

    public ErrorResponse(ErrorCode errorCode, String detail) {
        this.statusCode = errorCode.getHttpStatus().value();
        this.error = errorCode.getHttpStatus().name();
        this.code = errorCode.name();
        this.message = errorCode.getMessage();
        this.detail = detail;
    }

}