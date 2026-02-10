package com.ddip.backend.user.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {

    private String message;

    public static MessageDto from(UserResponseDto responseDto,String password) {
        String nickname = responseDto.getNickname();
        String msg = String.format("%s님, 임시 비밀번호는 %s 입니다.", nickname, password);

        return MessageDto.builder()
                .message(msg)
                .build();
    }
}