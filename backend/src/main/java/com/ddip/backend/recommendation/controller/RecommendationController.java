package com.ddip.backend.recommendation.controller;

import com.ddip.backend.common.security.auth.CustomUserDetails;
import com.ddip.backend.recommendation.dto.RecommendationResponseDto;
import com.ddip.backend.recommendation.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/recommend")
@Tag(name = "Recommendation", description = "성향 기반 개인화 추천 API")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/projects")
    @Operation(
            summary = "성향 기반 프로젝트 추천",
            description = "로그인 유저의 성향에 맞는 프로젝트를 추천합니다. 설문 미완료 시 최신순으로 반환합니다."
    )
    public ResponseEntity<List<RecommendationResponseDto>> recommendProjects(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        List<RecommendationResponseDto> result = recommendationService.recommend(userDetails.getUserId());
        return ResponseEntity.ok(result);
    }
}
