package com.ddip.backend.service;

import com.ddip.backend.dto.crowd.ProjectRequestDto;
import com.ddip.backend.exception.reward.RewardTierRequiredException;
import com.ddip.backend.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CrowdFundingServiceTest {

    @InjectMocks
    private CrowdFundingService crowdFundingService;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserService userService;

    @Test
    void 프로젝트_생성시_리워드가_없으면_예외() {
        // given
        ProjectRequestDto dto = ProjectRequestDto.builder()
                .title("테스트 프로젝트")
                .description("설명")
                .targetAmount(10000L)
                .rewardTiers(List.of())
                .build();

        // when & then
        assertThrows(
                RewardTierRequiredException.class,
                () -> crowdFundingService.createProject(dto, 1L)
        );
    }
}