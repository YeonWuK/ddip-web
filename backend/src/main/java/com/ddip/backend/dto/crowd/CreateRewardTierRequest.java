package com.ddip.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateRewardTierRequest {

    @NotBlank
    @Size(max = 200)
    private String title;

    @NotBlank
    private String description;

    @NotNull
    @Min(1)
    private Long price;

    // null이면 무제한
    @Min(1)
    private Integer limitQuantity;
}