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
import com.ddip.backend.exception.pledge.PledgeAccessDeniedException;
import com.ddip.backend.exception.pledge.PledgeNotFoundException;
import com.ddip.backend.exception.project.InvalidProjectStatusException;
import com.ddip.backend.exception.project.ProjectNotFoundException;
import com.ddip.backend.exception.reward.InvalidQuantityException;
import com.ddip.backend.exception.reward.RewardMismatchException;
import com.ddip.backend.exception.reward.RewardNotFoundException;
import com.ddip.backend.exception.user.UserNotFoundException;
import com.ddip.backend.repository.PledgeRepository;
import com.ddip.backend.repository.ProjectRepository;
import com.ddip.backend.repository.RewardTierRepository;
import com.ddip.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class PledgeService {

    private final PledgeRepository pledgeRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final RewardTierRepository rewardTierRepository;
    private final PointService pointService;

    public PledgeResponseDto createPledge(Long userId, Long projectId, PledgeCreateRequestDto requestDto) {
        // 1) 사용자 확인
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // 2) 프로젝트 확인
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));

        // 프로젝트 상태 검증: 진행중일 때만 후원 가능 등
        project.assertStatus(ProjectStatus.OPEN);

        // 3) 리워드 티어 확인
        RewardTier rewardTier = rewardTierRepository.findById(requestDto.getRewardTierId())
                .orElseThrow(() -> new RewardNotFoundException(requestDto.getRewardTierId()));

        // 4) 리워드 티어가 해당 프로젝트 소속인지 검증
        rewardTier.assertBelongsTo(project);

        // 5) 수량 검증
        int quantity = requestDto.getQuantity();
        if (quantity <= 0) {
            throw new InvalidQuantityException(quantity);
        }

        // 6) 실제 필요한 포인트 금액 계산
        long requiredAmount = rewardTier.getPrice() * (long) quantity;

        // 7) 잔액 충분한지 도메인 레벨에서 한 번 더 확인
        user.assertEnoughPoint(requiredAmount);

        // 8) Pledge 생성
        Pledge pledge = Pledge.toEntity(user, project, rewardTier, requiredAmount);
        Pledge saved = pledgeRepository.save(pledge);

        // 9) 포인트 사용 및 상태 전이
        usePointForPledge(userId, saved.getAmount(), saved.getId()); // saved.getAmount() == requiredAmount
        pledge.paidFunding(); // PENDING -> PAID

        // 10) 캐시 필드/재고 반영
        project.increaseCurrentAmount(saved.getAmount());
        rewardTier.increaseSoldQuantity(quantity);

        log.info("성공적으로 구매 되었습니다. userId={}, pledgeId={}", userId, saved.getId());
        return PledgeResponseDto.from(saved);
    }

    @Transactional(readOnly = true)
    public List<PledgeResponseDto> getAllPledge(Long userId) {
        return pledgeRepository.findByUserId(userId).stream()
                .map(PledgeResponseDto::from)
                .toList();
    }

    public void cancelPledge(Long userId, Long pledgeId) {
        Pledge pledge = pledgeRepository.findById(pledgeId)
                .orElseThrow(() -> new PledgeNotFoundException(pledgeId));

        // 본인의 pledge 맞는지 검증
        pledge.assertOwnedBy(userId);
        // 이미 취소 됬거나 확정, 배송중 인경우 취소 불가.
        pledge.assertCancelable();

        long amount = pledge.getAmount();

        // 포인트 환불
        refundPointForPledge(userId, amount, pledgeId);

        // 상태/금액 롤백
        pledge.canceledFunding();
        pledge.getProject().decreaseCurrentAmount(amount);

        log.info("성공적으로 후원이 취소되었습니다. userId={}, pledgeId={}, refundAmount={}", userId, pledgeId, amount);
    }

    public void refundAllFailedProjects(Long projectId) {
        // 펀딩 실패 시 환불 대상은 "결제 완료(PAID)" 상태인 애들
        List<Pledge> pledges = pledgeRepository.findByProjectIdAndStatus(projectId, PledgeStatus.PAID);

        for (Pledge pledge : pledges) {
            refundPointForPledge(pledge.getUser().getId(), pledge.getAmount(), pledge.getId());
            pledge.canceledFunding();
            pledge.getProject().decreaseCurrentAmount(pledge.getAmount()); // 캐시도 롤백
        }
    }

    public List<Pledge> getPledgesByProject(Long projectId) {
        return pledgeRepository.findByProjectId(projectId);
    }

    public List<Pledge> getPledgesByUser(Long userId) {
        return pledgeRepository.findByUserId(userId);
    }

    private void usePointForPledge(Long userId, long amount, Long pledgeId) {
        pointService.changePoint(userId, -amount, PointLedgerType.USE, PointLedgerSource.PLEDGE, pledgeId,
                "Pledge 결제 (pledgeId=" + pledgeId + ")");
    }

    private void refundPointForPledge(Long userId, long amount, Long pledgeId) {
        pointService.changePoint(userId, amount, PointLedgerType.REFUND, PointLedgerSource.PLEDGE, pledgeId,
                "Pledge 환불 (pledgeId=" + pledgeId + ")");
    }
}
