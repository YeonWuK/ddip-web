package com.ddip.backend.project.validation.reward;

import com.ddip.backend.common.exception.BusinessException;
import com.ddip.backend.common.exception.ErrorCode;

public class RewardTierRequiredException extends BusinessException {

    public RewardTierRequiredException() {
        super(ErrorCode.INVALID_REQUEST, "리워드는 최소 1개 이상 필요합니다.");
    }

    public RewardTierRequiredException(Long projectId) {
        super(ErrorCode.PROJECT_REWARD_REQUIRED, "리워드가 1개 이상 필요합니다. projectId=" + projectId);
    }

}
