package com.ddip.backend.dto.enums;

public enum AdminActionType {

    // USER
    USER_BAN,
    USER_UNBAN,
    USER_FORCE_LOGOUT,

    // PROJECT
    PROJECT_APPROVE,
    PROJECT_REJECT,
    PROJECT_FORCE_STOP,
    PROJECT_FORCE_CANCEL,

    // AUCTION
    AUCTION_FORCE_CLOSE,
    AUCTION_CANCEL,

    // POINT
    POINT_ADJUST

}