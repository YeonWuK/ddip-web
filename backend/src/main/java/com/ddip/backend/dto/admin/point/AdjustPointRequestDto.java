package com.ddip.backend.dto.admin.point;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AdjustPointRequestDto {

    private Long userId;

    private long adjustPoint;

    private String reason;

}
