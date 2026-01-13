package com.ddip.backend.dto.crowd;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PledgeCreateRequestDto {

    @NotEmpty
    @Valid
    private List<PledgeItemRequestDto> items;

    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PledgeItemRequestDto {

        @NotNull
        private Long rewardTierId;

        @NotNull
        @Min(1)
        private Integer quantity;
    }
}