package com.ddip.backend.dto.crowd;

import com.ddip.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatorDto {

    private Long id;
    private String email;
    private String nickname;

    public static CreatorDto from(User user) {
        return CreatorDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .build();
    }

}