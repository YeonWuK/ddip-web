package com.ddip.backend.security.utils;

import com.ddip.backend.dto.exception.security.ProfileIncompleteDeniedException;
import com.ddip.backend.service.UserService;
import lombok.RequiredArgsConstructor;
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

    private final UserService userService;

    @Override
    public AuthorizationDecision check(Supplier<Authentication> authentication, RequestAuthorizationContext object) {

        Authentication auth = authentication.get();

        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            return new AuthorizationDecision(false);
        }

        String email = auth.getName();

        boolean complete = userService.getIsActive(email);


        if (!complete) {
            throw new ProfileIncompleteDeniedException("프로필을 먼저 완료하세요.");
        }

        return new AuthorizationDecision(true);
    }
}