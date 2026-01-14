package com.ddip.backend.exception.project;

import com.ddip.backend.dto.enums.ProjectStatus;
import com.ddip.backend.exception.common.BusinessException;
import com.ddip.backend.exception.common.ErrorCode;

public class InvalidProjectStatusException extends BusinessException {

    public InvalidProjectStatusException(ProjectStatus current, ProjectStatus expected) {
        super(ErrorCode.PROJECT_INVALID_STATUS, "프로젝트 상태 전이가 불가합니다. current=" + current + ", expected=" + expected);
    }

    public InvalidProjectStatusException(ProjectStatus current, ProjectStatus... expected) {
        super(ErrorCode.INVALID_REQUEST, "프로젝트 상태가 올바르지 않습니다. current=" + current + ", expected=" + java.util.Arrays.toString(expected));
    }

}
