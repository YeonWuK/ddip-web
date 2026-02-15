package com.ddip.backend.pledge.service;

import com.ddip.backend.pledge.domain.Pledge;
import com.ddip.backend.pledge.repository.PledgeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPledgeQueryService {

    private final PledgeRepository pledgeRepository;

    public List<Pledge> getPledgesByUser(Long userId) {
        return pledgeRepository.findByUserId(userId);
    }

    public List<Pledge> getPledgesByProject(Long projectId) {
        return pledgeRepository.findByProjectId(projectId);
    }

}