package com.ddip.backend.exception.reward;

import com.ddip.backend.exception.BusinessException;
import com.ddip.backend.exception.ErrorCode;

public class RewardNotFoundException extends BusinessException {

    public RewardNotFoundException(Long rewardId) {
        super(ErrorCode.REWARD_NOT_FOUND , "존재하지 않는 Project 입니다. projectId = "+rewardId);
    }

}
