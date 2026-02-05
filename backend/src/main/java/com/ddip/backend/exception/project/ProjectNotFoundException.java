package com.ddip.backend.exception.project;

import com.ddip.backend.exception.BusinessException;
import com.ddip.backend.exception.ErrorCode;

public class ProjectNotFoundException extends BusinessException {

    public ProjectNotFoundException(Long projectId) {
        super(ErrorCode.PROJECT_NOT_FOUND, "존재하지 않는 Project 입니다. projectId = "+projectId);
    }

}
