package com.ddip.backend.dto.crowd;


import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectUpdateRequestDto {

    @Size(max = 200)
    private String title;

    private String description;

    @Min(1)
    private Long targetAmount;

    private LocalDate startAt;
    private LocalDate endAt;

    @Size(max = 100)
    private String categoryPath;

    @Size(max = 500)
    private String tags;

    @Size(max = 200)
    private String summary;

    private List<RewardTierRequestDto> rewardTiers;

    private List<Long> imageIds;

}