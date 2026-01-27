package com.ddip.backend.dto.oauth2;

import com.ddip.backend.dto.enums.AuthProvider;
import com.ddip.backend.dto.enums.Role;
import com.ddip.backend.security.oauth2.Oauth2UserInfo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SocialUserRequestDto {
    private String email;
    private String nickname;
    private String provider;
    private String providerId;
    private Role role;

    public static SocialUserRequestDto from(Oauth2UserInfo oauth2UserInfo) {
        return SocialUserRequestDto.builder()
                .email(oauth2UserInfo.getEmail())
                .nickname(oauth2UserInfo.getName())
                .providerId(oauth2UserInfo.getProviderId())
                .provider(oauth2UserInfo.getProvider().toUpperCase())
                .role(Role.USER)
                .build();
    }
}
