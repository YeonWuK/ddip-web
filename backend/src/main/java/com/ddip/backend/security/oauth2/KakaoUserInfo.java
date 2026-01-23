package com.ddip.backend.security.oauth2;

import com.ddip.backend.dto.enums.AuthProvider;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public class KakaoUserInfo implements Oauth2UserInfo {

    private final Map<String, Object> attributes;

    @Override
    public String getProviderId() {
        return attributes.get("id").toString();
    }

    @Override
    public String getProvider() {return AuthProvider.KAKAO.name();}

    @Override
    public String getEmail() {
        Map<String, Object> kakaoAccount = getAccount(attributes);

        return (String) kakaoAccount.get("email");
    }

    @Override
    public String getName() {
        Map<String, Object> kakaoAccount = getAccount(attributes);
        Map<String, Object> profile = getProfile(kakaoAccount);

        return (String) profile.get("nickname");
    }

    private Map<String, Object> getAccount(Map<String, Object> attributes) {
        ObjectMapper objectMapper = new ObjectMapper();
        TypeReference<Map<String, Object>> typeRef = new TypeReference<>() {
        };

        Object kakaoAccount = attributes.get("kakao_account");

        return objectMapper.convertValue(kakaoAccount, typeRef);
    }

    private Map<String, Object> getProfile(Map<String, Object> kakaoAccount) {
        ObjectMapper objectMapper = new ObjectMapper();
        TypeReference<Map<String, Object>> typeRef = new TypeReference<>() {
        };

        Object profile = kakaoAccount.get("profile");

        return objectMapper.convertValue(profile, typeRef);
    }
}