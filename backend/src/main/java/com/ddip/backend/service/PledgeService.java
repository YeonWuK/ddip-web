package com.ddip.backend.service;

import com.ddip.backend.dto.crowd.PledgeCreateRequestDto;
import com.ddip.backend.dto.crowd.PledgeResponseDto;
import com.ddip.backend.dto.enums.PledgeStatus;
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

    public PledgeResponseDto createPledge(Long userId, Long projectId, PledgeCreateRequestDto requestDto) {
        // 1) 사용자 확인
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // 2) 프로젝트 확인
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));

        // 프로젝트 상태 검증: 진행중일 때만 후원 가능 등
        project.assertOpen();

        // 3) 리워드 티어 확인
        RewardTier rewardTier = rewardTierRepository.findById(requestDto.getRewardTierId())
                .orElseThrow(() -> new RewardNotFoundException(requestDto.getRewardTierId()));

        // 4) 리워드 티어가 해당 프로젝트 소속인지 검증
        rewardTier.assertBelongsTo(project);

        Pledge pledge = Pledge.toEntity(user, project, rewardTier, requestDto.getQuantity());
        Pledge saved = pledgeRepository.save(pledge);

        // Project 전체 currentAmount 누적 증가
        project.increaseCurrentAmount(saved.getAmount());
        // rewardTier 재고 검증 및 판매 수량 증가
        rewardTier.increaseSoldQuantity(requestDto.getQuantity());

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

        pledge.assertOwnedBy(userId);

        // 상태 전이 체크: 이미 취소된 건 취소 불가 등
        pledge.assertNotCanceled();
        // 취소 가능한 상태인지 확인 Payment 엔티티 만들어서 따로 확인 할 예정
//        pledge.assertCancelable();

        pledge.cancel();
        // 금액 환원
        Project project = pledge.getProject();
        project.decreaseCurrentAmount(pledge.getAmount());
        log.info("성공적으로 취소 되었습니다. userId= {} , pledgeId = {}", userId, pledgeId);
    }

}
