package com.ddip.backend.project.validation.project;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class ProjectAccessDeniedException extends BusinessException {

    public ProjectAccessDeniedException(Long projectId, Long userId) {
        super(ErrorCode.PROJECT_FORBIDDEN, "프로젝트 접근 권한이 없습니다. projectId=" + projectId + ", userId=" + userId);
    }

}