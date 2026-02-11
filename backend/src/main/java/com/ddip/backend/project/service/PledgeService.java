package com.ddip.backend.project.service;

import com.ddip.backend.project.dto.crowd.pledge.PledgeCreateRequestDto;
import com.ddip.backend.project.dto.crowd.pledge.PledgeCreateResponseDto;
import com.ddip.backend.project.dto.enums.PledgeStatus;
import com.ddip.backend.billing.dto.PointLedgerSource;
import com.ddip.backend.billing.dto.PointLedgerType;
import com.ddip.backend.project.dto.enums.ProjectStatus;
import com.ddip.backend.project.domain.Pledge;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.domain.RewardTier;
import com.ddip.backend.billing.service.PointService;
import com.ddip.backend.user.domain.User;
import com.ddip.backend.project.event.ProjectEsEvent;
import com.ddip.backend.project.validation.pledge.PledgeNotFoundException;
import com.ddip.backend.project.validation.project.ProjectNotFoundException;
import com.ddip.backend.project.validation.reward.InvalidQuantityException;
import com.ddip.backend.project.validation.reward.RewardNotFoundException;
import com.ddip.backend.user.validation.user.UserNotFoundException;
import com.ddip.backend.project.repository.PledgeRepository;
import com.ddip.backend.project.repository.ProjectRepository;
import com.ddip.backend.project.repository.RewardTierRepository;
import com.ddip.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PledgeService {

    private final ApplicationEventPublisher publisher;
    private final PledgeRepository pledgeRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final RewardTierRepository rewardTierRepository;
    private final PointService pointService;

    /**
     *  후원 생성
     */
    @Transactional
    public PledgeCreateResponseDto createPledge(Long userId, Long projectId, PledgeCreateRequestDto requestDto) {

        User user = getUser(userId);
        Project project = getOpenProject(projectId);

        List<PledgeItemContext> contexts = buildPledgeContexts(requestDto, project);

        long totalRequiredAmount = calculateTotalRequiredAmount(contexts);
        user.assertEnoughPoint(totalRequiredAmount);

        String orderId = UUID.randomUUID().toString();

        List<Pledge> savedPledges = createAndPayPledges(user, project, contexts, orderId);

        publisher.publishEvent(new ProjectEsEvent(project.getId()));

        return PledgeCreateResponseDto.of(projectId, orderId, savedPledges);
    }

    private List<Pledge> createAndPayPledges(User user, Project project, List<PledgeItemContext> contexts, String orderId) {

        List<Pledge> pledges = new ArrayList<>();

        for (PledgeItemContext ctx : contexts) {

            Pledge pledge = Pledge.toEntity(orderId, user.getId(), project.getId(),
                    ctx.rewardTier().getId(), ctx.requiredAmount(), ctx.quantity());

            Pledge saved = pledgeRepository.save(pledge);

            processPayment(saved, user, project, ctx);

            pledges.add(saved);
        }

        return pledges;
    }

    /**
     *  결제 처리
     */
    private void processPayment(Pledge pledge, User user, Project project, PledgeItemContext ctx) {

        // 1) 포인트 차감
        usePointForPledge(user.getId(), pledge.getPaidAmount(), pledge.getId());

        // 2) Pledge 상태 변경
        pledge.paidFunding();

        // 3) 프로젝트 모금액 증가
        project.increaseCurrentAmount(pledge.getPaidAmount());

        // 4) RewardTier 판매 수량 증가
        ctx.rewardTier().increaseSoldQuantity(ctx.quantity());
    }

    /**
     *  후원 취소
     */
    @Transactional
    public void cancelPledge(Long userId, Long pledgeId) {
        Pledge pledge = pledgeRepository.findById(pledgeId)
                .orElseThrow(() -> new PledgeNotFoundException(pledgeId));

        pledge.assertOwnedBy(userId);
        pledge.assertCancelable();

        cancelAndRefund(pledge);

        log.info("후원 취소 완료 userId={}, pledgeId={}", userId, pledgeId);
    }

    private void cancelAndRefund(Pledge pledge) {

        long amount = pledge.getPaidAmount();

        // 1) 환불
        refundPointForPledge(pledge.getUserId(), amount, pledge.getId());

        // 2) 상태 변경
        pledge.canceledFunding();

        // 3) 프로젝트 금액 롤백
        Project project = projectRepository.findById(pledge.getProjectId())
                .orElseThrow(() -> new ProjectNotFoundException(pledge.getProjectId()));
        project.decreaseCurrentAmount(amount);

        // 4) 리워드 티어 롤백
        if (pledge.getRewardTierId() != null) {
            RewardTier tier = rewardTierRepository.findById(pledge.getRewardTierId())
                    .orElseThrow(() -> new RewardNotFoundException(pledge.getRewardTierId()));
            tier.decreaseSoldQuantity(pledge.getPurchasedQuantity());
        }
    }

    /**
     * 특정 사용자의 모든 Pledge 조회 (Admin 등 내부용)
     */
    @Transactional(readOnly = true)
    public List<Pledge> getPledgesByUser(Long userId) {
        return pledgeRepository.findByUserId(userId);
    }

    /**
     * 특정 사용자의 모든 후원 이력 (orderId 기준으로 묶은 히스토리)
     */
    @Transactional(readOnly = true)
    public List<PledgeCreateResponseDto> getPledgeHistory(Long userId) {

        List<Pledge> pledges = pledgeRepository.findByUserId(userId);

        if (pledges.isEmpty()) {
            return List.of();
        }

        // orderId 기준으로 묶기
        Map<String, List<Pledge>> groupedByOrder =
                pledges.stream().collect(Collectors.groupingBy(Pledge::getOrderId));

        // 각 orderId 묶음을 PledgeCreateResponseDto로 변환
        return groupedByOrder.values().stream()
                .map(this::toCreateResponse)
                .toList();
    }

    private PledgeCreateResponseDto toCreateResponse(List<Pledge> group) {
        Pledge first = group.get(0);
        // Pledge가 이제 projectId만 가지고 있으니 그걸 사용
        return PledgeCreateResponseDto.of(first.getProjectId(), first.getOrderId(), group);
    }

    /**
     * 특정 프로젝트의 모든 Pledge 조회 (Admin 등 내부용)
     */
    @Transactional(readOnly = true)
    public List<Pledge> getPledgesByProject(Long projectId) {
        return pledgeRepository.findByProjectId(projectId);
    }

    /**
     * 펀딩 실패 시, 해당 프로젝트의 결제 완료(PAID) 상태 후원 전체 환불
     */
    @Transactional
    public void refundAllFailedProjects(Long projectId) {
        List<Pledge> pledges =
                pledgeRepository.findByProjectIdAndStatus(projectId, PledgeStatus.PAID);

        for (Pledge pledge : pledges) {
            cancelAndRefund(pledge);
        }
    }

    // ---------------------------------------------------
    // 유틸 메서드
    // ---------------------------------------------------
    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    private Project getOpenProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));
        project.assertStatus(ProjectStatus.OPEN);
        return project;
    }

    private RewardTier getRewardTierBelongsToProject(Long rewardTierId, Project project) {
        RewardTier rewardTier = rewardTierRepository.findById(rewardTierId)
                .orElseThrow(() -> new RewardNotFoundException(rewardTierId));
        rewardTier.assertBelongsTo(project);
        return rewardTier;
    }

    private int validateQuantity(int quantity) {
        if (quantity <= 0) throw new InvalidQuantityException(quantity);
        return quantity;
    }

    private long calculateRequiredAmount(RewardTier rewardTier, int quantity) {
        return rewardTier.getPrice() * (long) quantity;
    }

    private List<PledgeItemContext> buildPledgeContexts(PledgeCreateRequestDto requestDto, Project project) {
        List<PledgeItemContext> contexts = new ArrayList<>();

        for (PledgeCreateRequestDto.PledgeItemDto item : requestDto.getItems()) {
            RewardTier rewardTier = getRewardTierBelongsToProject(item.getRewardTierId(), project);
            int quantity = validateQuantity(item.getQuantity());
            long requiredAmount = calculateRequiredAmount(rewardTier, quantity);

            contexts.add(new PledgeItemContext(rewardTier, quantity, requiredAmount));
        }

        return contexts;
    }

    private long calculateTotalRequiredAmount(List<PledgeItemContext> contexts) {
        return contexts.stream()
                .mapToLong(PledgeItemContext::requiredAmount)
                .sum();
    }

    // ---------------------------------------------------
    // 포인트 처리
    // ---------------------------------------------------
    private void usePointForPledge(Long userId, long amount, Long pledgeId) {
        pointService.changePoint(userId, -amount,
                PointLedgerType.USE, PointLedgerSource.PLEDGE, pledgeId,
                "Pledge 결제 (pledgeId=" + pledgeId + ")");
    }

    private void refundPointForPledge(Long userId, long amount, Long pledgeId) {
        pointService.changePoint(userId, amount,
                PointLedgerType.REFUND, PointLedgerSource.PLEDGE, pledgeId,
                "Pledge 환불 (pledgeId=" + pledgeId + ")");
    }

    private record PledgeItemContext(
            RewardTier rewardTier,
            int quantity,
            long requiredAmount
    ) {}
}