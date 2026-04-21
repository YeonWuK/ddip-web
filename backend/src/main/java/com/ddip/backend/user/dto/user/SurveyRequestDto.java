package com.ddip.backend.user.dto.user;

import com.ddip.backend.user.dto.enums.UserType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SurveyRequestDto {

    @NotNull(message = "성향 유형은 필수입니다.")
    private UserType userType;
}
