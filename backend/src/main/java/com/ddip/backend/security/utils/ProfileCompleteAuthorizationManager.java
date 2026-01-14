package com.ddip.backend.security.utils;

import com.ddip.backend.dto.exception.security.ProfileIncompleteDeniedException;
import com.ddip.backend.security.auth.CustomUserDetails;
import com.ddip.backend.security.auth.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
public class ProfileCompleteAuthorizationManager
        implements AuthorizationManager<RequestAuthorizationContext> {

    private final CustomUserDetailsService userDetailsService;

    @Override
    public AuthorizationDecision check(Supplier<Authentication> authentication, RequestAuthorizationContext object) {

        Authentication auth = authentication.get();

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AuthenticationCredentialsNotFoundException("인증 필요");
        }

        String email = auth.getName();

        CustomUserDetails userDetails = (CustomUserDetails) userDetailsService.loadUserByUsername(email);

        if (!userDetails.getIsActive()) {
            throw new ProfileIncompleteDeniedException("프로필을 먼저 완료하세요.");
        }

        return new AuthorizationDecision(true);
    }
}