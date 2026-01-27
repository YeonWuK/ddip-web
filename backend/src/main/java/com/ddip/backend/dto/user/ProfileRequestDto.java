package com.ddip.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileRequestDto {

    @NotBlank(message = "이름은 필수 입력 값입니다.")
    @Pattern(regexp = "^[가-힣]*$" , message = "이름은 한글만 사용 가능합니다.")
    private String username;

    @NotBlank(message = "닉네임은 필수 입력 값입니다.")
    @Pattern(regexp = "^(?=.{2,15}$)(?!.*\\.{2,})[가-힣a-zA-Z0-9._-]+(?<!\\.)$",
            message = "닉네임은 2~15자, 한글/영문/숫자와 . _ - 만 가능하며, 점(.)을 연속으로 쓰거나 마지막에 쓸 수 없습니다."
    )
    private String nickname;

    @NotBlank(message = "전화번호를 입력해주세요.")
    @Pattern(regexp = "^\\d{3}\\d{3,4}\\d{4}$" ,message = "전화번호는 앞자리는 01이며, 중간 3~4자리, 세번째는 4자리인 전화번호를 입력해주세요.")
    private String phoneNumber;
}