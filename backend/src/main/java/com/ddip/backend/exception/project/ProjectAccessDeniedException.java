package com.ddip.backend.exception.project;

import com.ddip.backend.exception.common.BusinessException;
import com.ddip.backend.exception.common.ErrorCode;

public class ProjectAccessDeniedException extends BusinessException {

    public ProjectAccessDeniedException(Long projectId, Long userId) {
        super(ErrorCode.PROJECT_FORBIDDEN,
                "프로젝트 접근 권한이 없습니다. projectId=" + projectId + ", userId=" + userId);
    }

}