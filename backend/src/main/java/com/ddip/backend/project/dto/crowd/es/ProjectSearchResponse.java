package com.ddip.backend.project.dto.crowd.es;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectSearchResponse {

    private Long id;

    private String title;

    private String thumbnailUrl;

    private Long targetAmount;

    private Long currentAmount;

    private String status;

    private LocalDate startAt;

    private LocalDate endAt;
}
