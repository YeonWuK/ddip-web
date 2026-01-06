package com.ddip.backend.security.oauth2;

public interface Oauth2UserInfo {
    String getProviderId();

    String getProvider();

    String getEmail();

    String getName();
}
