package com.ddip.backend.service;

import com.ddip.backend.dto.crowd.PledgeCreateRequestDto;
import com.ddip.backend.dto.crowd.PledgeResponseDto;
import com.ddip.backend.dto.enums.PledgeStatus;
import com.ddip.backend.dto.enums.PointLedgerSource;
import com.ddip.backend.dto.enums.PointLedgerType;
import com.ddip.backend.dto.enums.ProjectStatus;
import com.ddip.backend.entity.Pledge;
import com.ddip.backend.entity.Project;
import com.ddip.backend.entity.RewardTier;
import com.ddip.backend.entity.User;
import com.ddip.backend.exception.reward.InvalidQuantityException;
import com.ddip.backend.exception.reward.RewardNotFoundException;
import com.ddip.backend.exception.project.ProjectNotFoundException;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.PledgeRepository;
import com.ddip.backend.repository.ProjectRepository;
import com.ddip.backend.repository.RewardTierRepository;
import com.ddip.backend.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PledgeServiceTest {
//
//    @InjectMocks
//    private PledgeService pledgeService;
//
//    @Mock
//    private PledgeRepository pledgeRepository;
//
//    @Mock
//    private UserRepository userRepository;
//
//    @Mock
//    private ProjectRepository projectRepository;
//
//    @Mock
//    private RewardTierRepository rewardTierRepository;
//
//    @Mock
//    private PointService pointService;
//
//    @Test
//    @DisplayName("정상 후원 생성 시 포인트 사용, 금액/재고/상태가 올바르게 반영된다")
//    void createPledge_success() {
//        // given
//        Long userId = 1L;
//        Long projectId = 10L;
//        Long rewardTierId = 100L;
//
//        int quantity = 2;
//        long price = 5_000L;
//        long requiredAmount = price * quantity;
//
//        User user = User.builder()
//                .id(userId)
//                .nickname("tester")
//                .pointBalance(requiredAmount)
//                .build();
//        // 도메인 안에서 assertEnoughPoint(requiredAmount)를 쓸 거라고 가정
//        // 필요하면 user에 pointBalance 세팅 메서드로 충분한 포인트를 넣어두면 됨
//
//        Project project = Project.builder()
//                .id(projectId)
//                .status(ProjectStatus.OPEN)
//                .currentAmount(0L)
//                .targetAmount(100_000L)
//                .build();
//
//        RewardTier tier = RewardTier.builder()
//                .id(rewardTierId)
//                .project(project)
//                .price(price)
//                .limitQuantity(100)
//                .soldQuantity(0)
//                .build();
//
//        PledgeCreateRequestDto request = new PledgeCreateRequestDto(rewardTierId, quantity);
//
//        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
//        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
//        when(rewardTierRepository.findById(rewardTierId)).thenReturn(Optional.of(tier));
//
//        // save() 호출 시 ID가 부여된 Pledge 를 리턴하도록 스텁
//        when(pledgeRepository.save(any(Pledge.class)))
//                .thenAnswer(invocation -> {
//                    Pledge p = invocation.getArgument(0);
//                    return Pledge.builder()
//                            .id(999L)
//                            .user(p.getUser())
//                            .project(p.getProject())
//                            .rewardTier(p.getRewardTier())
//                            .amount(p.getAmount())
//                            .status(p.getStatus())
//                            .build();
//                });
//
//        // when
//        PledgeResponseDto response = pledgeService.createPledge(userId, projectId, request);
//
//        // then
//        assertNotNull(response);
//        assertEquals(999L, response.getPledgeId());
//        assertEquals(requiredAmount, response.getAmount());
//
//        // 포인트 사용 호출 검증
//        verify(pointService, times(1))
//                .changePoint(eq(userId), eq(-requiredAmount),
//                        eq(PointLedgerType.USE), eq(PointLedgerSource.PLEDGE),
//                        eq(999L), anyString());
//
//        // 프로젝트 모금액 증가 검증
//        assertEquals(requiredAmount, project.getCurrentAmount());
//
//        // 리워드 판매 수량 증가 검증
//        assertEquals(quantity, tier.getSoldQuantity());
//    }
//
//    @Test
//    @DisplayName("사용자가 존재하지 않으면 UserNotFoundException 발생")
//    void createPledge_userNotFound() {
//        Long userId = 1L;
//        Long projectId = 10L;
//        PledgeCreateRequestDto request = new PledgeCreateRequestDto(100L, 1);
//
//        when(userRepository.findById(userId)).thenReturn(Optional.empty());
//
//        assertThrows(
//                UserNotFoundException.class,
//                () -> pledgeService.createPledge(userId, projectId, request)
//        );
//    }
//
//    @Test
//    @DisplayName("프로젝트가 존재하지 않으면 ProjectNotFoundException 발생")
//    void createPledge_projectNotFound() {
//        Long userId = 1L;
//        Long projectId = 10L;
//        PledgeCreateRequestDto request = new PledgeCreateRequestDto(100L, 1);
//
//        when(userRepository.findById(userId)).thenReturn(Optional.of(User.builder().id(userId).build()));
//        when(projectRepository.findById(projectId)).thenReturn(Optional.empty());
//
//        assertThrows(
//                ProjectNotFoundException.class,
//                () -> pledgeService.createPledge(userId, projectId, request)
//        );
//    }
//
//    @Test
//    @DisplayName("리워드 티어가 존재하지 않으면 RewardNotFoundException 발생")
//    void createPledge_rewardTierNotFound() {
//        Long userId = 1L;
//        Long projectId = 10L;
//        Long rewardTierId = 100L;
//
//        PledgeCreateRequestDto request = new PledgeCreateRequestDto(rewardTierId, 1);
//
//        when(userRepository.findById(userId)).thenReturn(Optional.of(User.builder().id(userId).build()));
//        when(projectRepository.findById(projectId)).thenReturn(Optional.of(
//                Project.builder().id(projectId).status(ProjectStatus.OPEN).build()
//        ));
//        when(rewardTierRepository.findById(rewardTierId)).thenReturn(Optional.empty());
//
//        assertThrows(
//                RewardNotFoundException.class,
//                () -> pledgeService.createPledge(userId, projectId, request)
//        );
//    }
//
//    @Test
//    @DisplayName("수량이 0이하이면 InvalidQuantityException 발생")
//    void createPledge_invalidQuantity() {
//        Long userId = 1L;
//        Long projectId = 10L;
//        Long rewardTierId = 100L;
//
//        PledgeCreateRequestDto request = new PledgeCreateRequestDto(rewardTierId, 0);
//
//        when(userRepository.findById(userId)).thenReturn(Optional.of(User.builder().id(userId).build()));
//        when(projectRepository.findById(projectId)).thenReturn(Optional.of(
//                Project.builder().id(projectId).status(ProjectStatus.OPEN).build()
//        ));
//        when(rewardTierRepository.findById(rewardTierId)).thenReturn(Optional.of(
//                RewardTier.builder().id(rewardTierId).project(Project.builder().id(projectId).build()).price(1000L).build()
//        ));
//
//        assertThrows(
//                InvalidQuantityException.class,
//                () -> pledgeService.createPledge(userId, projectId, request)
//        );
//    }
//
//    @Test
//    @DisplayName("후원 취소 성공 시 포인트 환불 및 상태/금액 롤백")
//    void cancelPledge_success() {
//        // given
//        Long userId = 1L;
//        Long projectId = 10L;
//        Long pledgeId = 999L;
//
//        Project project = Project.builder()
//                .id(projectId)
//                .status(ProjectStatus.OPEN)
//                .currentAmount(20_000L)
//                .targetAmount(50_000L)
//                .build();
//
//        User user = User.builder()
//                .id(userId)
//                .nickname("tester")
//                .build();
//
//        RewardTier tier = RewardTier.builder()
//                .id(100L)
//                .project(project)
//                .price(10_000L)
//                .soldQuantity(2)
//                .build();
//
//        Pledge pledge = Pledge.builder()
//                .id(pledgeId)
//                .user(user)
//                .project(project)
//                .rewardTier(tier)
//                .amount(20_000L)
//                .status(PledgeStatus.PAID)
//                .build();
//
//        when(pledgeRepository.findById(pledgeId)).thenReturn(Optional.of(pledge));
//
//        // when
//        pledgeService.cancelPledge(userId, pledgeId);
//
//        // then
//        verify(pointService, times(1))
//                .changePoint(eq(userId), eq(20_000L),
//                        eq(PointLedgerType.REFUND), eq(PointLedgerSource.PLEDGE),
//                        eq(pledgeId), anyString());
//
//        assertEquals(PledgeStatus.CANCELED, pledge.getStatus());
//        assertEquals(0L, project.getCurrentAmount());
//    }
}