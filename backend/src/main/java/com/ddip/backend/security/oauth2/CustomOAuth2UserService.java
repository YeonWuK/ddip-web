package com.ddip.backend.security.oauth2;

import com.ddip.backend.dto.oauth2.SocialUserRequestDto;
import com.ddip.backend.entity.User;
import com.ddip.backend.repository.UserRepository;
import com.ddip.backend.security.auth.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        Map<String, Object> oAuth2UserAttributes = super.loadUser(userRequest).getAttributes();

        String registrationId = userRequest.getClientRegistration().getRegistrationId();

        Oauth2UserInfo oauth2UserInfo = getOauth2UserInfo(registrationId, oAuth2UserAttributes);

        User newUser = createUserFromOauth(oauth2UserInfo);

        User user = userRepository.findByEmail(newUser.getEmail())
                .orElseGet(() -> userRepository.save(newUser));
        
        return new CustomUserDetails(user, oAuth2UserAttributes);
    }

    private Oauth2UserInfo getOauth2UserInfo(String registrationId, Map<String, Object> userAttributes) {
        if ("google".equals(registrationId)) {
            return new GoogleUserInfo(userAttributes);
        } else if ("kakao".equals(registrationId)) {
            return new KakaoUserInfo(userAttributes);
        } else if ("naver".equals(registrationId)) {
            log.info("userAttributes: {}", userAttributes);
            return new NaverUserinfo(userAttributes);
        }
        throw new OAuth2AuthenticationException("Unsupported provider: " + registrationId);
    }

    private User createUserFromOauth(Oauth2UserInfo oauth2UserInfo){
        return User.from(SocialUserRequestDto.from(oauth2UserInfo));
    }
}