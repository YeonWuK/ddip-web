package com.ddip.backend.service;

import com.ddip.backend.dto.crowd.PledgeCreateRequestDto;
import com.ddip.backend.dto.crowd.PledgeResponseDto;
import com.ddip.backend.dto.enums.PledgeStatus;
import com.ddip.backend.dto.enums.ProjectStatus;
import com.ddip.backend.entity.Pledge;
import com.ddip.backend.entity.Project;
import com.ddip.backend.entity.RewardTier;
import com.ddip.backend.entity.User;
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
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다. userId=" + userId));

        // 2) 프로젝트 확인
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 프로젝트입니다. projectId=" + projectId));

        // 프로젝트 상태 검증: 진행중일 때만 후원 가능 등
         if (project.getStatus() != ProjectStatus.OPEN) {
             throw new IllegalStateException("현재 후원할 수 없는 프로젝트 상태입니다.");
         }

        // 3) 리워드 티어 확인
        RewardTier rewardTier = rewardTierRepository.findById(requestDto.getRewardTierId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 리워드입니다. rewardTierId=" + requestDto.getRewardTierId()));

        // 4) 리워드 티어가 해당 프로젝트 소속인지 검증
        if (rewardTier.getProject() == null || !rewardTier.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("해당 프로젝트의 리워드가 아닙니다.");
        }

        int quantity = requestDto.getQuantity();
        if (quantity <= 0) {
            throw new IllegalArgumentException("수량은 1 이상이어야 합니다.");
        }

        // 5) 금액 계산 (rewardTier 가격 필드명은 예시: getPrice())
        long unitPrice = rewardTier.getPrice();
        long amount = unitPrice * (long) quantity;

        // 6) Pledge 생성
        Pledge pledge = Pledge.builder()
                .user(user)
                .project(project)
                .rewardTier(rewardTier)
                .amount(amount)
                .status(PledgeStatus.PENDING)
                .build();

        Pledge saved = pledgeRepository.save(pledge);

        // currentAmount 누적 증가
        project.increaseCurrentAmount(amount);

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
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 후원입니다. pledgeId=" + pledgeId));

        if (!pledge.getUser().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("본인의 후원만 취소할 수 있습니다.");
        }

        // 상태 전이 체크: 이미 취소된 건 취소 불가 등
        if (pledge.getStatus() == PledgeStatus.CANCELED) {
            return;
        }

        // (선택) 취소 가능한 상태인지 확인
        // if (pledge.getStatus() != PledgeStatus.PAID) {
        //     throw new IllegalStateException("취소할 수 없는 상태입니다.");
        // }

        pledge.cancel(); // 메서드 없으면 pledge.setStatus(PledgeStatus.CANCELED)
        // 금액 환원(정책에 따라)
        Project project = pledge.getProject();
        project.decreaseCurrentAmount(pledge.getAmount()); // 메서드 없으면 setCurrentAmount - amount
    }

}
