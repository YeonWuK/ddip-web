package com.ddip.backend.recommendation.config;

import com.ddip.backend.project.dto.enums.ProjectCategory;
import com.ddip.backend.user.dto.enums.UserType;

import java.util.List;
import java.util.Map;

/**
 * 성향별 AHP 기준 가중치 테이블
 *
 * 기준 인덱스 (공통)
 *   0: socialValue    — 사회적 가치
 *   1: reliability    — 신뢰성 (likeCount 기반)
 *   2: socialProof    — 사회적 증거 (후원자 수)
 *   3: functionality  — 기능성 (리워드 종류 수)
 *   4: economicValue  — 경제적 가치 (최저 리워드 가격)
 *   5: feasibility    — 실행 가능성 (달성률)
 *   6: backerCount    — 후원자 수
 *   7: achievementRate— 목표 달성률
 *   8: urgency        — 마감 임박성
 */
public class AhpWeightConfig {

    private AhpWeightConfig() {}

    private static final Map<UserType, double[]> WEIGHTS = Map.of(
            UserType.VALUE_ORIENTED,     new double[]{0.50, 0.30, 0.20, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00},
            UserType.PRACTICAL_ORIENTED, new double[]{0.00, 0.00, 0.00, 0.40, 0.35, 0.25, 0.00, 0.00, 0.00},
            UserType.TREND_ORIENTED,     new double[]{0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.40, 0.35, 0.25}
    );

    /**
     * 성향별 선호 카테고리 목록
     * - VALUE_ORIENTED    : 사회적 가치가 높은 카테고리
     * - PRACTICAL_ORIENTED: 실용적/기능적 카테고리
     * - TREND_ORIENTED    : null → 카테고리 필터 없이 전체 대상으로 트렌드 정렬
     */
    private static final Map<UserType, List<ProjectCategory>> PREFERRED_CATEGORIES = Map.of(
            UserType.VALUE_ORIENTED,     List.of(
                    ProjectCategory.ENVIRONMENT,
                    ProjectCategory.SOCIAL,
                    ProjectCategory.EDUCATION,
                    ProjectCategory.CULTURE
            ),
            UserType.PRACTICAL_ORIENTED, List.of(
                    ProjectCategory.TECH,
                    ProjectCategory.HEALTH,
                    ProjectCategory.FOOD,
                    ProjectCategory.FASHION
            )
    );

    public static double[] getWeights(UserType userType) {
        return WEIGHTS.getOrDefault(userType, WEIGHTS.get(UserType.TREND_ORIENTED));
    }

    /**
     * 성향에 해당하는 선호 카테고리 목록 반환.
     * TREND_ORIENTED 는 카테고리 무관(전체 대상)이므로 null 반환.
     */
    public static List<ProjectCategory> getPreferredCategories(UserType userType) {
        return PREFERRED_CATEGORIES.get(userType); // TREND_ORIENTED → null
    }
}
