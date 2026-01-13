package com.ddip.backend.security.oauth2;

import com.ddip.backend.dto.enums.AuthProvider;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;

import java.util.Map;

@RequiredArgsConstructor
public class NaverUserinfo implements Oauth2UserInfo {

    private final Map<String, Object> attributes;

    @Override
    public String getProviderId() {
        Map<String, Object> response = getResponse(attributes);
        return (String) response.get("id");
    }

    @Override
    public String getProvider() {return AuthProvider.NAVER.name();}

    @Override
    public String getEmail() {
        Map<String, Object> response = getResponse(attributes);
        return (String) response.get("email");
    }

    @Override
    public String getName() {
        Map<String, Object> response = getResponse(attributes);
        return (String) response.get("name");
    }

    private Map<String, Object> getResponse(Map<String,Object> attributes) {
        ObjectMapper objectMapper = new ObjectMapper();
        TypeReference<Map<String, Object>> typeRef = new TypeReference<>() {
        };

        Object Response = attributes.get("response");

        return objectMapper.convertValue(Response, typeRef);
    }
}
