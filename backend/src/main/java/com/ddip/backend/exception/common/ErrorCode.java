package com.ddip.backend.exception.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // ===== Request =====
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "잘못된 요청입니다."),
    INVALID_PARAMETER(HttpStatus.BAD_REQUEST, "요청 파라미터가 올바르지 않습니다."),
    MISSING_PARAMETER(HttpStatus.BAD_REQUEST, "필수 요청 값이 누락되었습니다."),
    INVALID_STATE(HttpStatus.BAD_REQUEST, "요청 상태가 올바르지 않습니다."),

    // ===== Auth =====
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "만료된 토큰입니다."),
    BLACKLISTED_TOKEN(HttpStatus.UNAUTHORIZED, "로그아웃된 토큰입니다."),

    // ===== Authorization =====
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    PROFILE_INCOMPLETE(HttpStatus.FORBIDDEN, "프로필이 완성되지 않았습니다."),

    // ===== User =====
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 사용자입니다."),

    // ===== Project =====
    PROJECT_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 프로젝트입니다."),
    PROJECT_FORBIDDEN(HttpStatus.FORBIDDEN, "프로젝트 접근 권한이 없습니다."),
    PROJECT_INVALID_STATUS(HttpStatus.BAD_REQUEST, "프로젝트 상태 전이가 불가능합니다."),
    PROJECT_REWARD_REQUIRED(HttpStatus.BAD_REQUEST, "프로젝트에는 최소 1개 이상의 리워드가 필요합니다."),

    // ===== Reward =====
    REWARD_NOT_FOUND(HttpStatus.NOT_FOUND, "존재하지 않는 리워드입니다."),

    // ===== Common =====
    NOT_FOUND(HttpStatus.NOT_FOUND, "요청하신 리소스를 찾을 수 없습니다."),
    CONFLICT(HttpStatus.CONFLICT, "이미 존재하는 리소스입니다."),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");

    public final HttpStatus httpStatus;
    public final String message;
}