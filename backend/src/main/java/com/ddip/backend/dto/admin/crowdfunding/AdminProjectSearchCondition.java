package com.ddip.backend.dto.admin.crowdfunding;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProjectSearchCondition {

    private String title;           // 제목 키워드
    private String creatorEmail;    // 크리에이터 이메일
    private String creatorUsername; // 크리에이터 username
    private String status;
    private String categoryPath;    // "캠핑/텐트" 등

    // 기간 필터 (선택적으로 사용)
    private LocalDate startFrom;    // start_at >=
    private LocalDate startTo;      // start_at <=

}