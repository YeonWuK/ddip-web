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
import com.ddip.backend.event.ProjectEsEvent;
import com.ddip.backend.exception.pledge.PledgeNotFoundException;
import com.ddip.backend.exception.project.ProjectNotFoundException;
import com.ddip.backend.exception.reward.InvalidQuantityException;
import com.ddip.backend.exception.reward.RewardNotFoundException;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.PledgeRepository;
import com.ddip.backend.repository.ProjectRepository;
import com.ddip.backend.repository.RewardTierRepository;
import com.ddip.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PledgeService {

    private final ApplicationEventPublisher publisher;
    private final PledgeRepository pledgeRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final RewardTierRepository rewardTierRepository;
    private final PointService pointService;

    /**
     * 후원 생성
     */
    public PledgeResponseDto createPledge(Long userId, Long projectId, PledgeCreateRequestDto requestDto) {
        // 1. 사용자 / 프로젝트 / 리워드 조회 및 검증
        User user = getUser(userId);
        Project project = getOpenProject(projectId);
        RewardTier rewardTier = getRewardTierBelongsToProject(requestDto.getRewardTierId(), project);

        // 2. 수량 및 필요한 포인트 금액 계산
        int quantity = validateQuantity(requestDto.getQuantity());
        long requiredAmount = calculateRequiredAmount(rewardTier, quantity);

        // 3. 도메인 레벨 포인트 잔액 검증
        user.assertEnoughPoint(requiredAmount);

        // 4. Pledge 엔티티 생성 및 저장
        Pledge pledge = Pledge.toEntity(user, project, rewardTier, requiredAmount, quantity);
        Pledge saved = pledgeRepository.save(pledge);

        // 5. 포인트 차감 + Pledge/Project/RewardTier 상태 업데이트
        processPayment(userId, saved, quantity);

        // 6. ES 인덱스 갱신 이벤트 발행
        publisher.publishEvent(new ProjectEsEvent(project.getId()));

        log.info("성공적으로 구매 되었습니다. userId={}, pledgeId={}", userId, saved.getId());
        return PledgeResponseDto.from(saved);
    }

    /**
     * 특정 사용자의 모든 Pledge 조회 (응답 DTO 변환)
     */
    @Transactional(readOnly = true)
    public List<PledgeResponseDto> getAllPledges(Long userId) {
        return pledgeRepository.findByUserId(userId).stream()
                .map(PledgeResponseDto::from)
                .toList();
    }

    /**
     * 사용자의 단건 후원 취소
     */
    public void cancelPledge(Long userId, Long pledgeId) {
        Pledge pledge = pledgeRepository.findById(pledgeId).orElseThrow(() -> new PledgeNotFoundException(pledgeId));

        // 본인의 pledge 맞는지 검증
        pledge.assertOwnedBy(userId);
        // 이미 취소 / 확정 / 배송 중 등 취소 불가능 상태인지 검증
        pledge.assertCancelable();

        long amount = pledge.getAmount();

        // 포인트 환불 및 상태/금액 롤백
        cancelAndRefund(pledge);

        log.info("성공적으로 후원이 취소되었습니다. userId={}, pledgeId={}, refundAmount={}", userId, pledgeId, amount);
    }

    /**
     * 펀딩 실패 시, 해당 프로젝트의 결제 완료(PAID) 상태 후원 전체 환불
     */
    public void refundAllFailedProjects(Long projectId) {
        // 펀딩 실패 시 환불 대상은 "결제 완료(PAID)" 상태인 후원
        List<Pledge> pledges = pledgeRepository.findByProjectIdAndStatus(projectId, PledgeStatus.PAID);

        for (Pledge pledge : pledges) {
            cancelAndRefund(pledge);
        }
    }

    /**
     * 특정 프로젝트의 모든 Pledge 조회 (내부용: Entity 반환)
     */
    @Transactional(readOnly = true)
    public List<Pledge> getPledgesByProject(Long projectId) {
        return pledgeRepository.findByProjectId(projectId);
    }

    /**
     * 특정 사용자의 모든 Pledge 조회 (내부용: Entity 반환)
     */
    @Transactional(readOnly = true)
    public List<Pledge> getPledgesByUser(Long userId) {
        return pledgeRepository.findByUserId(userId);
    }


    /**
     * 공통: 포인트 환불 + Pledge 상태 변경 + 프로젝트 모금액 롤백
     */
    private void cancelAndRefund(Pledge pledge) {
        long amount = pledge.getAmount();
        Long userId = pledge.getUser().getId();
        Long pledgeId = pledge.getId();

        // 포인트 환불
        refundPointForPledge(userId, amount, pledgeId);

        // Pledge 상태 -> CANCELED (도메인 메서드 내에서 처리)
        pledge.canceledFunding();

        // 프로젝트 현재 모금액 롤백
        pledge.getProject().decreaseCurrentAmount(amount);

        pledge.getRewardTier().decreaseSoldQuantity(pledge.getRewardTier().getSoldQuantity());
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    }

    /**
     * 후원 생성 시 오픈 상태의 프로젝트 조회
     */
    private Project getOpenProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));
        // 프로젝트 상태가 OPEN 인지 도메인 수준에서 검증
        project.assertStatus(ProjectStatus.OPEN);
        return project;
    }

    /**
     * 후원 생성 시 프로젝트에 속한 리워드 티어 조회
     */
    private RewardTier getRewardTierBelongsToProject(Long rewardTierId, Project project) {
        RewardTier rewardTier = rewardTierRepository.findById(rewardTierId)
                .orElseThrow(() -> new RewardNotFoundException(rewardTierId));
        // 리워드 티어가 해당 프로젝트에 속하는지 검증
        rewardTier.assertBelongsTo(project);
        return rewardTier;
    }

    /**
     * 후원 수량 검증
     */
    private int validateQuantity(int quantity) {
        if (quantity <= 0) {
            throw new InvalidQuantityException(quantity);
        }
        return quantity;
    }

    /**
     * 리워드 가격 * 수량 으로 실제 필요 포인트 계산
     */
    private long calculateRequiredAmount(RewardTier rewardTier, int quantity) {
        return rewardTier.getPrice() * (long) quantity;
    }

    /**
     * 포인트 차감 및 후원/프로젝트/리워드 상태 갱신 처리
     */
    private void processPayment(Long userId, Pledge saved, int quantity) {
        // 포인트 차감
        usePointForPledge(userId, saved.getAmount(), saved.getId());

        // 후원 상태 PENDING -> PAID
        saved.paidFunding();

        // 프로젝트 현재 모금액 증가
        saved.getProject().increaseCurrentAmount(saved.getAmount());

        // 리워드 티어 판매 수량 증가
        saved.getRewardTier().increaseSoldQuantity(quantity);
    }

    /**
     * 포인트 차감 (후원 결제)
     */
    private void usePointForPledge(Long userId, long amount, Long pledgeId) {
        pointService.changePoint(userId, -amount, PointLedgerType.USE, PointLedgerSource.PLEDGE, pledgeId,
                "Pledge 결제 (pledgeId=" + pledgeId + ")");
    }

    /**
     * 포인트 환불 (후원 취소/실패)
     */
    private void refundPointForPledge(Long userId, long amount, Long pledgeId) {
        pointService.changePoint(userId, amount, PointLedgerType.REFUND, PointLedgerSource.PLEDGE, pledgeId,
                "Pledge 환불 (pledgeId=" + pledgeId + ")");
    }

}