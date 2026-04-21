package com.ddip.backend.project.dto.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ProjectCategory {

    ENVIRONMENT("환경/생태",   1.0),
    SOCIAL     ("사회/공동체", 0.9),
    EDUCATION  ("교육/학습",   0.9),
    CULTURE    ("문화/예술",   0.7),
    TECH       ("기술/IT",     0.6),
    HEALTH     ("건강/웰니스", 0.6),
    FOOD       ("식품/음료",   0.5),
    FASHION    ("패션/뷰티",   0.3),
    GAME       ("게임/취미",   0.2),
    ETC        ("기타",        0.2);

    private final String label;
    private final double socialValueScore;

    public static double getSocialValueScore(String categoryPath) {
        if (categoryPath == null) return ETC.socialValueScore;
        try {
            return ProjectCategory.valueOf(categoryPath.toUpperCase()).socialValueScore;
        } catch (IllegalArgumentException e) {
            return ETC.socialValueScore;
        }
    }
}
