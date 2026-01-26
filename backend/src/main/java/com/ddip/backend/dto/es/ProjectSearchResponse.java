package com.ddip.backend.dto.es;

import com.ddip.backend.entity.Project;
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

    private Integer fundingRate;

    private String status;

    private LocalDate startAt;

    private LocalDate endAt;

    private Long remainingDays;
}
