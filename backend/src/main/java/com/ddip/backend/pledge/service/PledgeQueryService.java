package com.ddip.backend.pledge.service;

import com.ddip.backend.pledge.domain.Pledge;
import com.ddip.backend.pledge.dto.PledgeCreateResponseDto;
import com.ddip.backend.pledge.repository.PledgeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PledgeQueryService {

    private final PledgeRepository pledgeRepository;

    public List<PledgeCreateResponseDto> getPledgeHistory(Long userId) {
        List<Pledge> pledges = pledgeRepository.findByUserId(userId);

        if (pledges.isEmpty()) {
            return List.of();
        }

        Map<String, List<Pledge>> groupedByOrder =
                pledges.stream().collect(Collectors.groupingBy(Pledge::getOrderId));

        return groupedByOrder.values().stream()
                .map(this::toCreateResponse)
                .toList();
    }

    private PledgeCreateResponseDto toCreateResponse(List<Pledge> group) {
        Pledge first = group.get(0);
        return PledgeCreateResponseDto.of(first.getProjectId(), first.getOrderId(), group);
    }

}

