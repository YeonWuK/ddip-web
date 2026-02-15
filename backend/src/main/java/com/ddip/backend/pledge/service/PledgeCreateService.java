package com.ddip.backend.pledge.service;

import com.ddip.backend.pledge.domain.Pledge;
import com.ddip.backend.pledge.dto.PledgeCreateRequestDto;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.domain.RewardTier;
import com.ddip.backend.project.dto.enums.ProjectStatus;
import com.ddip.backend.project.exception.project.ProjectNotFoundException;
import com.ddip.backend.project.exception.reward.InvalidQuantityException;
import com.ddip.backend.project.exception.reward.RewardNotFoundException;
import com.ddip.backend.pledge.repository.PledgeRepository;
import com.ddip.backend.project.repository.ProjectRepository;
import com.ddip.backend.project.repository.RewardTierRepository;
import com.ddip.backend.user.domain.User;
import com.ddip.backend.user.repository.UserRepository;
import com.ddip.backend.user.validation.user.UserNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PledgeCreateService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final RewardTierRepository rewardTierRepository;
    private final PledgeRepository pledgeRepository;
    private final PledgePaymentService pledgePaymentService;

    /**
     * 실수로 단독 호출 방지 Propagation.MANDATORY
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public PledgeCreationResult createPledge(Long userId, Long projectId, PledgeCreateRequestDto requestDto) {
        User user = getUser(userId);
        Project project = getOpenProjectForUpdate(projectId);

        List<PledgeItemContext> contexts = buildPledgeContexts(requestDto, project);
        long totalRequiredAmount = calculateTotalRequiredAmount(contexts);
        user.assertEnoughPoint(totalRequiredAmount);

        String orderId = UUID.randomUUID().toString();
        List<Pledge> savedPledges = createAndPayPledges(user, project, contexts, orderId);

        return new PledgeCreationResult(project.getId(), orderId, savedPledges);
    }

    private List<Pledge> createAndPayPledges(User user, Project project, List<PledgeItemContext> contexts, String orderId) {
        List<Pledge> pledges = new ArrayList<>();

        for (PledgeItemContext context : contexts) {
            Pledge pledge = Pledge.toEntity(orderId, user.getId(), project.getId(),
                    context.rewardTier().getId(), context.requiredAmount(), context.quantity());
            Pledge saved = pledgeRepository.save(pledge);

            pledgePaymentService.processPayment(saved, project, context.rewardTier(), context.quantity());
            pledges.add(saved);
        }

        return pledges;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
    }

    private Project getOpenProjectForUpdate(Long projectId) {
        Project project = projectRepository.findByIdForUpdate(projectId)
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
        if (quantity <= 0) {
            throw new InvalidQuantityException(quantity);
        }
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
        return contexts.stream().mapToLong(PledgeItemContext::requiredAmount).sum();
    }

    private record PledgeItemContext(RewardTier rewardTier, int quantity, long requiredAmount) {}

    public record PledgeCreationResult(Long projectId, String orderId, List<Pledge> pledges) {}
}

