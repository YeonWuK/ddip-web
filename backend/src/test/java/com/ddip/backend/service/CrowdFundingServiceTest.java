package com.ddip.backend.service;

import com.ddip.backend.dto.crowd.ProjectRequestDto;
import com.ddip.backend.dto.crowd.ProjectUpdateRequestDto;
import com.ddip.backend.dto.crowd.RewardTierRequestDto;
import com.ddip.backend.dto.enums.ProjectStatus;
import com.ddip.backend.entity.Project;
import com.ddip.backend.entity.User;
import com.ddip.backend.exception.reward.RewardTierRequiredException;
import com.ddip.backend.repository.ProjectRepository;
import com.ddip.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrowdFundingServiceTest {

    @InjectMocks
    private CrowdFundingService crowdFundingService;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private PledgeService pledgeService;


//    @Test
//    void 프로젝트_생성시_리워드가_없으면_예외() {
//        // given
//        ProjectRequestDto dto = ProjectRequestDto.builder()
//                .title("테스트 프로젝트")
//                .description("설명")
//                .targetAmount(10000L)
//                .rewardTiers(List.of())
//                .build();
//
//        // when & then
//        assertThrows(RewardTierRequiredException.class,
//                () -> crowdFundingService.createProject(dto, 1L));
//    }
//
//    @Test
//    @DisplayName("DRAFT 상태의 내 프로젝트를 수정하면 필드가 DTO 값으로 업데이트된다")
//    void 펀딩_업데이트_수정_확인() {
//        // given
//        Long userId = 1L;
//        Long projectId = 100L;
//
//        // 프로젝트 소유자
//        User owner = com.ddip.backend.entity.User.builder()
//                .id(userId)
//                .build();
//
//        // 기존 프로젝트 (DRAFT 상태)
//        Project project = Project.builder()
//                .id(projectId)
//                .creator(owner)
//                .title("기존 제목")
//                .description("기존 설명")
//                .targetAmount(10_000L)
//                .status(ProjectStatus.DRAFT)  // 수정 가능 상태
//                .build();
//
//        // 리워드 DTO 하나 (null 방지용, 실제 로직에서도 최소 1개 필요)
//        RewardTierRequestDto rewardDto =
//                RewardTierRequestDto.builder()
//                        .title("리워드1")
//                        .description("리워드 설명")
//                        .price(5_000L)
//                        .limitQuantity(100)
//                        .build();
//
//        ProjectUpdateRequestDto updateDto = ProjectUpdateRequestDto.builder()
//                .title("수정된 제목")
//                .description("수정된 설명")
//                .targetAmount(20_000L)
//                // 날짜는 굳이 검증 안 할 거면 null 로 둬도 됨
//                .rewardTiers(List.of(rewardDto))
//                .build();
//
//        when(projectRepository.findById(projectId)).thenReturn(java.util.Optional.of(project));
//
//        // when
//        crowdFundingService.updateProject(projectId, userId, updateDto);
//
//        // then
//        assertAll(
//                () -> assertEquals("수정된 제목", project.getTitle()),
//                () -> assertEquals("수정된 설명", project.getDescription()),
//                () -> assertEquals(20_000L, project.getTargetAmount()),
//                () -> assertEquals(ProjectStatus.DRAFT, project.getStatus()) // 상태는 그대로
//        );
//
//        // repository 호출 검증
//        verify(projectRepository, times(1)).findById(projectId);
//        verifyNoMoreInteractions(projectRepository);
//    }
//
//    @Test
//    @DisplayName("마감일이 지난 OPEN 프로젝트 중 실패한 것들은 환불 로직이 호출된다")
//    void closeExpireProjects_refundFailedProjects() {
//        // given
//        LocalDate today = LocalDate.now();
//
//        // 성공할 프로젝트
//        Project successProject = Project.builder()
//                .id(1L)
//                .status(ProjectStatus.OPEN)
//                .targetAmount(10_000L)
//                .currentAmount(20_000L)  // target 이상 → SUCCESS
//                .endAt(today.minusDays(1))
//                .build();
//
//        // 실패할 프로젝트
//        Project failedProject = Project.builder()
//                .id(2L)
//                .status(ProjectStatus.OPEN)
//                .targetAmount(50_000L)
//                .currentAmount(10_000L)  // target 미만 → FAILED
//                .endAt(today.minusDays(1))
//                .build();
//
//        when(projectRepository.findByStatusAndEndAtLessThanEqual(eq(ProjectStatus.OPEN), any(LocalDate.class)))
//                .thenReturn(List.of(successProject, failedProject));
//
//        // when
//        crowdFundingService.closeExpireProjects();
//
//        // then
//        // 실패 프로젝트에 대해 refundAllFailedProjects 호출
//        verify(pledgeService, times(1)).refundAllFailedProjects(2L);
//
//        // 성공 프로젝트에 대해서는 호출 X
//        verify(pledgeService, never()).refundAllFailedProjects(1L);
//    }


}