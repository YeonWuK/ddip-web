package com.ddip.backend.dto.crowd;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
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
public class ProjectRequestDto {

    @NotBlank
    @Size(max = 200)
    private String title;

    // 긴 본문
    @NotBlank
    private String description;

    @NotNull
    @Min(1)
    private Long targetAmount;

    @NotNull
    private LocalDate startAt;

    @NotNull
    private LocalDate endAt;

    @Size(max = 100)
    private String categoryPath;

    @Size(max = 500)
    private String tags;

    @Size(max = 200)
    private String summary;

    @NotBlank
    private String thumbnailImageUrl;

//    // 본문 이미지들 (2~3개, 순서 중요)
//    @NotNull
//    @Size(max = 5)
//    private List<@NotBlank String> contentImageUrls;

    @NotNull
    @Valid
    private List<RewardTierRequestDto> rewardTiers;

}