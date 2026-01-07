package com.skytracker.dto.user;

import com.skytracker.security.oauth2.Oauth2UserInfo;
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
    private String name;
    private String provider;
    private String providerId;
    private Role role;

    public static SocialUserRequestDto from(Oauth2UserInfo oauth2UserInfo) {
        return SocialUserRequestDto.builder()
                .email(oauth2UserInfo.getEmail())
                .name(oauth2UserInfo.getName())
                .provider(oauth2UserInfo.getProvider())
                .providerId(oauth2UserInfo.getProviderId())
                .role(Role.USER)
                .build();
    }

}