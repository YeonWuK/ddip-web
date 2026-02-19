package com.ddip.backend.pledge.service;

import com.ddip.backend.pledge.dto.PledgeCreateRequestDto;
import com.ddip.backend.pledge.dto.PledgeCreateResponseDto;
import com.ddip.backend.pledge.dto.enums.PledgeStatus;
import com.ddip.backend.pledge.domain.Pledge;
import com.ddip.backend.project.domain.Project;
import com.ddip.backend.project.event.ProjectEsEvent;
import com.ddip.backend.project.exception.pledge.PledgeNotFoundException;
import com.ddip.backend.project.exception.project.ProjectNotFoundException;
import com.ddip.backend.pledge.repository.PledgeRepository;
import com.ddip.backend.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PledgeService {

    private final ApplicationEventPublisher publisher;
    private final PledgeCreateService pledgeCreateService;
    private final PledgePaymentService pledgePaymentService;
    private final PledgeRepository pledgeRepository;
    private final ProjectRepository projectRepository;

    /**
     *  후원 생성
     */
    @Transactional
    public PledgeCreateResponseDto createPledge(Long userId, Long projectId, PledgeCreateRequestDto requestDto) {
        PledgeCreateService.PledgeCreationResult result = pledgeCreateService.createPledge(userId, projectId, requestDto);

        publisher.publishEvent(new ProjectEsEvent(result.projectId()));
        return PledgeCreateResponseDto.of(result.projectId(), result.orderId(), result.pledges());
    }

    /**
     *  후원 취소
     */
    @Transactional
    public void cancelPledge(Long userId, Long pledgeId) {
        Pledge pledge = pledgeRepository.findById(pledgeId).orElseThrow(() -> new PledgeNotFoundException(pledgeId));

        Project project = projectRepository.findByIdForUpdate(pledge.getProjectId())
                        .orElseThrow(() -> new ProjectNotFoundException(pledge.getProjectId()));

        pledge.assertOwnedBy(userId);
        pledge.assertCancelable();

        pledgePaymentService.cancelAndRefund(pledge, project);

        log.info("후원 취소 완료 userId={}, pledgeId={}", userId, pledgeId);
    }

    /**
     * 해당 프로젝트의 결제 완료(PAID) 상태 후원을 전체 환불
     */
    @Transactional
    public void refundAllPaidPledges(Project project) {

        List<Pledge> pledges = pledgeRepository.findByProjectIdAndStatus(project.getId(), PledgeStatus.PAID);

        for (Pledge pledge : pledges) {
            pledgePaymentService.cancelAndRefund(pledge, project);
        }
    }

    /**
     * Scheduler 사용
     */
    @Transactional
    public void refundAllPaidPledgesByProjectId(Long projectId) {
        Project project = projectRepository.findByIdForUpdate(projectId)
                .orElseThrow(() -> new ProjectNotFoundException(projectId));
        refundAllPaidPledges(project);
    }
}
