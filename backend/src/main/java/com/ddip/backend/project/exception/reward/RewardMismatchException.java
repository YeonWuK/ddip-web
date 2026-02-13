package com.ddip.backend.project.exception.reward;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class RewardMismatchException extends BusinessException {

    public RewardMismatchException(Long rewardTierId, Long projectId) {
        super(ErrorCode.INVALID_REQUEST, "해당 프로젝트의 리워드가 아닙니다. rewardTierId=" + rewardTierId + ", projectId=" + projectId);
    }

}
