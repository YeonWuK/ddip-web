package com.ddip.backend.dto.crowd;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PledgeCreateRequestDto {

    @NotNull
    private Long rewardTierId;

    @NotNull
    @Min(1)
    private Integer quantity;

}